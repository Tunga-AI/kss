import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface EnrollmentData {
  month: string;
  enrollments: number;
  target?: number;
}

interface EnrollmentChartProps {
  data: EnrollmentData[];
  loading?: boolean;
}

const EnrollmentChart: React.FC<EnrollmentChartProps> = ({ data, loading = false }) => {
  if (loading) {
    return (
      <div className="h-80 bg-gray-50 rounded-lg animate-pulse flex items-center justify-center">
        <div className="text-gray-400">Loading enrollment data...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-80 bg-gray-50 rounded-lg flex items-center justify-center">
        <div className="text-gray-400 text-center">
          <div className="text-lg font-medium mb-2">No Enrollment Data</div>
          <div className="text-sm">Student enrollment trends will appear here</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="month" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#6b7280' }}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#6b7280' }}
          />
          <Tooltip 
            formatter={(value: number, name: string) => [
              `${value} ${name === 'enrollments' ? 'students' : 'target'}`,
              name === 'enrollments' ? 'Actual Enrollments' : 'Target'
            ]}
            labelStyle={{ color: '#374151' }}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Bar 
            dataKey="enrollments" 
            fill="#10B981"
            radius={[4, 4, 0, 0]}
          />
          {data.some(d => d.target !== undefined) && (
            <Bar 
              dataKey="target" 
              fill="#E5E7EB"
              radius={[4, 4, 0, 0]}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EnrollmentChart;