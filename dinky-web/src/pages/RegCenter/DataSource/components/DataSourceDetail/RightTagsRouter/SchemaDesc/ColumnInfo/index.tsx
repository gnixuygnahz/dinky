/*
 *
 *  Licensed to the Apache Software Foundation (ASF) under one or more
 *  contributor license agreements.  See the NOTICE file distributed with
 *  this work for additional information regarding copyright ownership.
 *  The ASF licenses this file to You under the Apache License, Version 2.0
 *  (the "License"); you may not use this file except in compliance with
 *  the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 *
 */

import { DataSources } from '@/types/RegCenter/data';
import { transformTreeData } from '@/utils/function';
import { l } from '@/utils/intl';
import { CheckSquareOutlined, KeyOutlined } from '@ant-design/icons';
import { ProTable } from '@ant-design/pro-components';
import { ProColumns } from '@ant-design/pro-table/es/typing';
import React, { useState } from 'react';
import { Empty, Modal, Table } from 'antd';
import { getMSColumnDataAnalysis, getMSColumns } from '@/pages/DataStudio/Toolbar/Catalog/service';
import { QueryParams } from '../../data';

type ColumnInfoProps = {
  columnInfo?: Partial<DataSources.Column[]>;
  tableInfo?: Partial<DataSources.Table>;
  queryParams?: QueryParams;
};

const ColumnInfo: React.FC<ColumnInfoProps> = (props) => {
  const { queryParams,columnInfo,tableInfo } = props;
  const [dataAnalysisDs, setDataAnalysisDs] = useState<any[]>([]);
  const [isDataAnalysisOpen, setIsDataAnalysisOpen] = useState(false);
  const [dataAnalysisloading, setDataAnalysisLoading] = React.useState<boolean>(true);
  const showDataAnalysis = async(record:any) => {

    const res = await getMSColumnDataAnalysis({
      databaseId:queryParams?.id,
      catalog:tableInfo?.catalog,
      database:tableInfo?.schema,
      table:tableInfo?.name,
      dialect:tableInfo?.driverType?.toLocaleLowerCase(),
      column:record.name
    });
    let gourp:any[] = [];

    Object.keys(res.fieldGroupCount).forEach(key => {
      gourp.push({
        enums:key,
        count:res.fieldGroupCount[key]
      })
    });
    setDataAnalysisDs(gourp)
    setDataAnalysisLoading(false);
  };

  const handleDataAnalysisOk = () => {
    setIsDataAnalysisOpen(false);
  };

  const columns: ProColumns<DataSources.Column>[] = [
    // {
    //   title: l('rc.ds.no'),
    //   dataIndex: 'position',
    //   width: '4%'
    // },
    {
      title: l('rc.ds.columnName'),
      dataIndex: 'name',
      width: '10%',
      ellipsis: true
    },
    {
      title: l('rc.ds.columnType'),
      dataIndex: 'type',
      width: '10%'
    },
    {
      title: l('rc.ds.primarykey'),
      dataIndex: 'keyFlag',
      width: '4%',
      render: (_, record) => {
        return record.keyFlag ? <KeyOutlined style={{ color: '#FAA100' }} /> : undefined;
      }
    },
    {
      title: 'Partition Key',
      dataIndex: 'partaionKey',
      width: '4%',
      render: (_, record) => {
        return record.partaionKey ? <KeyOutlined style={{ color: '#21da31' }} /> : undefined;
      }
    },
    {
      title: l('rc.ds.autoIncrement'),
      dataIndex: 'autoIncrement',
      width: '4%',
      render: (_, record) => {
        return record.autoIncrement ? (
          <CheckSquareOutlined style={{ color: '#1296db' }} />
        ) : undefined;
      }
    },
    {
      title: l('rc.ds.isNull'),
      dataIndex: 'nullable',
      width: '4%',
      render: (_, record) => {
        return !record.nullable ? <CheckSquareOutlined style={{ color: '#1296db' }} /> : undefined;
      }
    },
    {
      title: l('rc.ds.default'),
      dataIndex: 'defaultValue',
      ellipsis: true,
      width: '8%'
    },
    {
      title: l('rc.ds.length'),
      dataIndex: 'length',
      width: '6%'
    },
    // {
    //   title: l('rc.ds.precision'),
    //   dataIndex: 'precision',
    //   width: '4%'
    // },
    // {
    //   title: l('rc.ds.decimalDigits'),
    //   dataIndex: 'scale',
    //   ellipsis: true,
    //   width: '6%'
    // },
    {
      title: l('rc.ds.character'),
      dataIndex: 'characterSet',
      width: '6%',
      ellipsis: true
    },
    {
      title: l('rc.ds.collationRule'),
      dataIndex: 'collation',
      width: '10%',
      ellipsis: true
    },
    {
      title: l('rc.ds.javaType'),
      dataIndex: 'javaType',
      ellipsis: true,
      width: '8%'
    },
    {
      title: l('rc.ds.comment'),
      dataIndex: 'comment',
      ellipsis: true
    },
    {
      title: '操作',
      valueType: 'option',
      key: 'option',
      render: (text, record, _, action) => [
        <a
          key="data_analysis"
          onClick={() => {
            setDataAnalysisLoading(true);
            setIsDataAnalysisOpen(true);
            showDataAnalysis(record);
          }}
        >
          数据探查
        </a>,
        // <a href={record.url} target="_blank" rel="noopener noreferrer" key="view">
        //   查看
        // </a>,
        // <TableDropdown
        //   key="actionGroup"
        //   onSelect={() => action?.reload()}
        //   menus={[
        //     { key: 'copy', name: '复制' },
        //     { key: 'delete', name: '删除' },
        //   ]}
        // />,
      ],
    }
  ];

  return (
    <>
      {columnInfo ? (
        <ProTable<DataSources.Column>
          toolBarRender={false}
          pagination={{
            defaultPageSize: 14,
            hideOnSinglePage: true
          }}
          search={false}
          options={false}
          size={'small'}
          bordered
          columns={columns}
          dataSource={transformTreeData(columnInfo) as DataSources.Column[]}
        />
      ) : (
        <Empty className={'code-content-empty'} description={l('rc.ds.detail.tips')} />
      )}
      <Modal title="探测结果"
      cancelButtonProps={{ disabled: true }}
      open={isDataAnalysisOpen} onOk={handleDataAnalysisOk} footer={null} closable={true}
      onCancel={handleDataAnalysisOk}
      loading={dataAnalysisloading}>
        <Table dataSource={dataAnalysisDs}
        // pagination={false}
        columns={[
           {
            title: '枚举值',
            dataIndex: 'enums',
            key: 'enums',
          },
          {
            title: '数量',
            dataIndex: 'count',
            key: 'count',
          },
        ]} />
      </Modal>
    </>
  );
};

export default ColumnInfo;
