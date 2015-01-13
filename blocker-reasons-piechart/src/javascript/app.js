Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    items: [
        {xtype:'container',itemId:'selection_box'},
        {xtype:'container',itemId:'display_box'},
        {xtype:'tsinfolink'}
    ],
    chartTitle: 'Blocker Causes',
    pickerOptions: [
                    {name: 'Last Month', value: -1},
                    {name: 'Last 2 Months', value: -2},
                    {name: 'Last 3 Months', value: -3},
                    {name: 'Last 6 Months', value: -6},
                    {name: 'Last 12 Months', value: -12}
                ],
    defaultPickerOption: 'Last 3 Months',
    launch: function() {
        this._initialize();
    },
    _initialize: function(){
        var store = Ext.create('Ext.data.Store',{
            fields: ['name','value'],
            data: this.pickerOptions
        });
        
        var cb = this.down('#selection_box').add({
            xtype: 'combobox',
            store: store,
            queryMode: 'local',
            fieldLabel: 'Show data from',
            labelAlign: 'right',
            displayField: 'name',
            valueField: 'value',
            value: -3,
            listeners: {
                scope: this,
                select: this._fetchData  
            }
        });
        this._fetchData(cb);
    },    
    _fetchData: function(cb){
        var start_date = Rally.util.DateTime.add(new Date(),"month",cb.getValue());
        var project = this.getContext().getProject().ObjectID;  
        
        Ext.create('Rally.technicalservices.BlockedArtifact.Store',{
            startDate: start_date,
            project: project,
            listeners: {
                scope: this,
                artifactsloaded: function(blockedArtifacts,success){
                    this.logger.log('artifactsLoaded', blockedArtifacts, success);
                    this._buildChart(blockedArtifacts);
                }
            }
        });
        
    },
    _buildChart: function(artifacts){
        this.down('#display_box').removeAll();
        var counts = Rally.technicalservices.BlockedToolbox.getCountsByReason(artifacts);
        
        var series_data = []; 
        Ext.Object.each(counts, function(key,val){
            series_data.push([key,val]);
        },this);
        var series = [{type: 'pie', name: this.chartTitle, data: series_data}];
        
        this.logger.log('_buildCharts', artifacts, series);
        
        this.down('#display_box').add({
            xtype: 'rallychart',
            chartData: {
                series: series,
            }, 
            chartConfig: {
                    chart: {
                        type: 'pie'
                    },
                    title: {
                        text: this.chartTitle
                    },
                    plotOptions: {
                        pie: {
                            dataLabels: {
                                enabled: true,
                                format: '<b>{point.name}</b><br/>{point.percentage:.0f}%'
                            }
                        }
                    }
                }
            });
    }
});