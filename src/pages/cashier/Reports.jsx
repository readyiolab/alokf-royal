// src/pages/cashier/Reports.jsx
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Download, FileText, TrendingUp } from 'lucide-react';


import CashierLayout from "../../components/layouts/CashierLayout";

const Reports = () => {
  const reportTypes = [
    {
      title: 'Daily Summary',
      description: 'Daily transactions and performance',
      icon: FileText,
      color: 'bg-blue-600'
    },
    {
      title: 'Player Analytics',
      description: 'Player activity and trends',
      icon: TrendingUp,
      color: 'bg-green-600'
    },
    {
      title: 'Credit Reports',
      description: 'Credit requests and settlements',
      icon: BarChart3,
      color: 'bg-purple-600'
    }
  ];

  return (
    <CashierLayout>
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 pb-2 border-b border-gray-200">
          <div>
            <h1 className="text-3xl font-bold text-black">Reports & Analytics</h1>
            <p className="text-base text-gray-600 mt-1">Generate and download various reports for cashier operations</p>
          </div>
          <Button variant="default" className="flex items-center gap-2" disabled>
            <Download className="w-5 h-5" />
            Export All
          </Button>
        </div>

        {/* Report Types */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {reportTypes.map((report) => {
            const Icon = report.icon;
            return (
              <Card key={report.title} className="bg-white border-gray-100 hover:shadow-xl transition-shadow group">
                <CardHeader>
                  <div className={`${report.color} w-14 h-14 rounded-lg flex items-center justify-center mb-4 shadow group-hover:scale-105 transition-transform`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-black group-hover:text-primary transition-colors">{report.title}</CardTitle>
                  <CardDescription className="text-gray-500">{report.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" disabled>
                    <Download className="w-4 h-4 mr-2" />
                    Generate Report
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Coming Soon Notice */}
        <Card className="bg-gradient-to-r from-gray-50 to-white border-gray-100 mt-8">
          <CardContent className="pt-12 pb-12">
            <div className="text-center">
              <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4 animate-pulse" />
              <h2 className="text-2xl font-semibold text-black mb-2">Advanced Reporting</h2>
              <p className="text-gray-600 max-w-md mx-auto">
                Detailed analytics and custom report generation features will be available soon.<br />
                Stay tuned for more insights and downloadable reports.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </CashierLayout>
  );
};

export default Reports;