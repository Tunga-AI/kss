import React, { forwardRef } from 'react';
import { Calendar, Users, MapPin, Tag, FileText, Download } from 'lucide-react';
import Logo from '../../../components/Logo';

interface Attendee {
  id: string;
  eventId: string;
  name: string;
  email: string;
  phone: string;
  registrationDate: string;
  status: 'registered' | 'attended' | 'no_show';
  paymentStatus?: 'pending' | 'completed' | 'failed' | 'free';
  paymentAmount?: number;
  paymentMethod?: string;
  mpesaCode?: string;
  customResponses: Record<string, any>;
}

interface Event {
  id: string;
  title: string;
  dates: Array<{
    date: string;
    startTime: string;
    endTime: string;
    location: string;
  }>;
  price?: number;
  currency?: string;
}

interface AttendeesPDFProps {
  attendees: Attendee[];
  events: Event[];
  filters?: {
    eventTitle?: string;
    paymentStatus?: string;
    dateRange?: { start: string; end: string };
  };
  onDownload?: () => void;
}

const AttendeesPDF = forwardRef<HTMLDivElement, AttendeesPDFProps>(({ 
  attendees, 
  events,
  filters,
  onDownload 
}, ref) => {
  const reportDate = new Date().toLocaleDateString();
  const reportTime = new Date().toLocaleTimeString();
  
  // Group attendees by event
  const attendeesByEvent = attendees.reduce((acc, attendee) => {
    if (!acc[attendee.eventId]) {
      acc[attendee.eventId] = [];
    }
    acc[attendee.eventId].push(attendee);
    return acc;
  }, {} as Record<string, Attendee[]>);

  // Calculate statistics
  const totalAttendees = attendees.length;
  const attendedCount = attendees.filter(a => a.status === 'attended').length;
  const registeredCount = attendees.filter(a => a.status === 'registered').length;
  const noShowCount = attendees.filter(a => a.status === 'no_show').length;
  const totalRevenue = attendees.reduce((sum, a) => sum + (a.paymentAmount || 0), 0);
  const paidCount = attendees.filter(a => a.paymentStatus === 'completed').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'attended': return 'text-green-600';
      case 'registered': return 'text-blue-600';
      case 'no_show': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getPaymentStatusColor = (status?: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'pending': return 'text-yellow-600';
      case 'failed': return 'text-red-600';
      case 'free': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div ref={ref} className="bg-white p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center space-x-4">
          <Logo size="xl" showText={true} textSize="2xl" />
          <div>
            <p className="text-secondary-600 text-sm mt-2">
              Kenya School of Sales
            </p>
            <p className="text-secondary-500 text-xs">
              Event Attendees Report
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <h1 className="text-3xl font-bold text-primary-600 mb-2">ATTENDEES REPORT</h1>
          <div className="text-sm text-secondary-600 space-y-1">
            <p><span className="font-medium">Report Date:</span> {reportDate}</p>
            <p><span className="font-medium">Generated:</span> {reportTime}</p>
            <p><span className="font-medium">Total Attendees:</span> {totalAttendees}</p>
          </div>
        </div>
      </div>

      {/* Filters Summary */}
      {filters && (filters.eventTitle || filters.paymentStatus || filters.dateRange) && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-secondary-800 mb-3 flex items-center">
            <FileText className="h-5 w-5 mr-2 text-primary-600" />
            Applied Filters
          </h3>
          <div className="bg-secondary-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {filters.eventTitle && (
                <div>
                  <span className="font-medium text-secondary-700">Event:</span>
                  <span className="text-secondary-600 ml-2">{filters.eventTitle}</span>
                </div>
              )}
              {filters.paymentStatus && (
                <div>
                  <span className="font-medium text-secondary-700">Payment Status:</span>
                  <span className="text-secondary-600 ml-2 capitalize">{filters.paymentStatus}</span>
                </div>
              )}
              {filters.dateRange && (
                <div>
                  <span className="font-medium text-secondary-700">Date Range:</span>
                  <span className="text-secondary-600 ml-2">
                    {filters.dateRange.start} to {filters.dateRange.end}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Statistics Summary */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-secondary-800 mb-3 flex items-center">
          <Users className="h-5 w-5 mr-2 text-primary-600" />
          Summary Statistics
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-blue-600">{registeredCount}</p>
            <p className="text-sm text-blue-800">Registered</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-green-600">{attendedCount}</p>
            <p className="text-sm text-green-800">Attended</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-red-600">{noShowCount}</p>
            <p className="text-sm text-red-800">No Shows</p>
          </div>
          <div className="bg-primary-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-primary-600">{paidCount}</p>
            <p className="text-sm text-primary-800">Paid</p>
          </div>
        </div>
        
        {totalRevenue > 0 && (
          <div className="mt-4 bg-accent-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-accent-800 font-medium">Total Revenue:</span>
              <span className="text-2xl font-bold text-accent-600">
                USD {totalRevenue.toLocaleString()}.00
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Attendees by Event */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-secondary-800 mb-4 flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-primary-600" />
          Attendees by Event
        </h3>

        {Object.entries(attendeesByEvent).map(([eventId, eventAttendees]) => {
          const event = events.find(e => e.id === eventId);
          if (!event) return null;

          return (
            <div key={eventId} className="mb-8 border border-gray-200 rounded-lg overflow-hidden">
              {/* Event Header */}
              <div className="bg-primary-600 text-white p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-xl font-semibold">{event.title}</h4>
                    <div className="flex items-center space-x-4 mt-2 text-primary-100">
                      {event.dates.length > 0 && (
                        <>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span className="text-sm">
                              {new Date(event.dates[0].date).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4" />
                            <span className="text-sm">{event.dates[0].location}</span>
                          </div>
                        </>
                      )}
                      {event.price && event.price > 0 && (
                        <div className="flex items-center space-x-1">
                          <Tag className="h-4 w-4" />
                          <span className="text-sm">
                            {event.currency || 'USD'} {event.price}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{eventAttendees.length}</p>
                    <p className="text-sm text-primary-100">Attendees</p>
                  </div>
                </div>
              </div>

              {/* Attendees Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3 font-medium text-gray-700">Name</th>
                      <th className="text-left p-3 font-medium text-gray-700">Contact</th>
                      <th className="text-center p-3 font-medium text-gray-700">Registration</th>
                      <th className="text-center p-3 font-medium text-gray-700">Status</th>
                      <th className="text-center p-3 font-medium text-gray-700">Payment</th>
                      <th className="text-right p-3 font-medium text-gray-700">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eventAttendees.map((attendee, index) => (
                      <tr key={attendee.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="p-3">
                          <p className="font-medium text-gray-900">{attendee.name}</p>
                        </td>
                        <td className="p-3">
                          <p className="text-sm text-gray-600">{attendee.email}</p>
                          <p className="text-sm text-gray-600">{attendee.phone}</p>
                        </td>
                        <td className="text-center p-3">
                          <p className="text-sm text-gray-600">
                            {new Date(attendee.registrationDate).toLocaleDateString()}
                          </p>
                        </td>
                        <td className="text-center p-3">
                          <span className={`text-sm font-medium capitalize ${getStatusColor(attendee.status)}`}>
                            {attendee.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="text-center p-3">
                          <span className={`text-sm font-medium capitalize ${getPaymentStatusColor(attendee.paymentStatus)}`}>
                            {attendee.paymentStatus || 'free'}
                          </span>
                        </td>
                        <td className="text-right p-3">
                          <span className="text-sm text-gray-900 font-medium">
                            {attendee.paymentAmount 
                              ? `${event.currency || 'USD'} ${attendee.paymentAmount.toLocaleString()}`
                              : 'Free'
                            }
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-secondary-200 text-center">
        <p className="text-secondary-500 text-sm">
          <strong>Kenya School of Sales</strong> - Building bold commercial talent for Africa
        </p>
        <p className="text-secondary-400 text-xs mt-1">
          Report generated on {reportDate} at {reportTime}
        </p>
      </div>

      {/* Download Button (only visible when not in PDF) */}
      {onDownload && (
        <div className="mt-6 text-center print:hidden">
          <button
            onClick={onDownload}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2 mx-auto"
          >
            <Download className="h-5 w-5" />
            <span>Download PDF</span>
          </button>
        </div>
      )}
    </div>
  );
});

AttendeesPDF.displayName = 'AttendeesPDF';

export default AttendeesPDF; 