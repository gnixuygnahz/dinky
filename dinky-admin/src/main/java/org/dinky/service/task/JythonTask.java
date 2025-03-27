package org.dinky.service.task;

import cn.hutool.extra.spring.SpringUtil;
import lombok.extern.slf4j.Slf4j;
import org.dinky.assertion.Asserts;
import org.dinky.config.Dialect;
import org.dinky.data.annotations.SupportDialect;
import org.dinky.data.dto.SqlDTO;
import org.dinky.data.dto.TaskDTO;
import org.dinky.data.model.DataBase;
import org.dinky.job.JobResult;
import org.dinky.metadata.driver.Driver;
import org.dinky.service.DataBaseService;
import org.python.core.AstList;
import org.python.core.Py;
import org.python.util.PythonInterpreter;

import java.util.List;
import java.util.concurrent.*;

@Slf4j
@SupportDialect({
        Dialect.JYTHON_PROGRAM
})
public class JythonTask extends BaseTask {

    PythonInterpreter interpreter;
    ExecutorService executor;

    public JythonTask(TaskDTO task) {
        super(task);
        interpreter = new PythonInterpreter();
        executor = Executors.newSingleThreadExecutor();
    }

    @Override
    public JobResult execute() throws Exception {
        log.info("Preparing to execute common sql...");
//        SqlDTO sqlDTO = SqlDTO.build(task.getStatement(), task.getDatabaseId(), null);
        SqlDTO sqlDTO = SqlDTO.build("select 1", task.getDatabaseId(), 100);
        DataBaseService dataBaseService = SpringUtil.getBean(DataBaseService.class);
        JobResult jobResult = dataBaseService.executeCommonSql(sqlDTO);
        DataBase dataBase = dataBaseService.getById(task.getDatabaseId());
        final List<JobResult> jobResultFromPy = new AstList();

        // 超时时间默认3分钟
        int timeout = 180;
        if (task.getConfigJson() != null && task.getConfigJson().getCustomConfigMaps() != null) {
            timeout = Integer.parseInt(task.getConfigJson().getCustomConfigMaps().getOrDefault("executeTimeout", "180"));
        }
        ExecutorService executor = Executors.newSingleThreadExecutor();
        FutureTask<Void> future =
                new FutureTask<>(() -> {
                    if (Asserts.isNotNull(dataBase)) {
                        Driver driver = Driver.build(dataBase.getDriverConfig());
//                        driver.query()
                        try (PythonInterpreter interpreter = new PythonInterpreter()) {
//                            interpreter.set("ds", driver);
                            interpreter.set("ds", dataBaseService);
                            interpreter.set("sql", sqlDTO);
                            interpreter.set("log", log);
//                            interpreter.set("output", jobResultFromPy);
                            interpreter.exec(Py.newStringUTF8(task.getStatement()));
                            if (interpreter.get("output") != null) {
                                jobResultFromPy.add((JobResult)interpreter.get("output").__tojava__(JobResult.class));
                            }
                        } catch (Exception e) {
                            log.error("执行异常", e);
                            jobResult.setError(e.getMessage());
                            jobResult.setSuccess(false);
                        }
                    }
                    return null;
                });
        executor.execute(future);
        try {
            if (timeout == 0) {
                future.get();
            } else {
                future.get(timeout, TimeUnit.SECONDS); //取得结果，同时设置超时执行时间为5秒。同样可以用future.get()，不设置执行超时时间取得结果
            }

        } catch (InterruptedException e) {
            log.error("执行中断", e);
            jobResult.setError(e.getMessage());
            jobResult.setSuccess(false);
        } catch (ExecutionException e) {
            log.error("执行异常", e);
            jobResult.setError(e.getMessage());
            jobResult.setSuccess(false);
        } catch (TimeoutException e) {
            log.error("执行超时", e);
            jobResult.setError(e.getMessage());
            jobResult.setSuccess(false);
        } finally {
            executor.shutdown();
        }
        if (!jobResult.isSuccess()) {
            return jobResult;
        }
        if (!jobResultFromPy.isEmpty() && jobResultFromPy.get(0)!=null) {
            return jobResultFromPy.get(0);
        }
        return jobResult;
    }

    @Override
    public boolean stop() {
        executor.shutdownNow();
        return true;
    }
}
