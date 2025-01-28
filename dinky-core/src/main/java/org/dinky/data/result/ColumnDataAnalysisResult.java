package org.dinky.data.result;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;

import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
@Setter
@Getter
@NoArgsConstructor
public class ColumnDataAnalysisResult extends AbstractResult implements IResult{

    Map<String, Integer> fieldGroupCount = new LinkedHashMap<>();

    @Override
    public String getJobId() {
        return null;
    }
}
