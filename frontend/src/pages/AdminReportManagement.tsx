import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Eye, CheckCircle, X, Clock, User, MessageSquare, Star, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiService from '@/services/api';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface Report {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  details?: string;
  status: string;
  createdAt: string;
  resolvedAt?: string;
  resolution?: string;
  reporter: {
    id: string;
    email: string;
    profile: {
      firstName: string;
      lastName: string;
    };
  };
  targetUser?: {
    id: string;
    email: string;
    warningCount: number;
    isSuspended: boolean;
    isBanned: boolean;
    lastWarningAt?: string;
    profile: {
      firstName: string;
      lastName: string;
    };
  };
}

const AdminReportManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [resolution, setResolution] = useState('');
  const [actionType, setActionType] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    resolved: 0,
    dismissed: 0
  });
  const { toast } = useToast();

  console.log('AdminReportManagement render:', { 
    user: user ? { id: user.id, isAdmin: user.isAdmin, userType: user.userType } : null,
    isModalOpen, 
    selectedReport: selectedReport ? selectedReport.id : null, 
    loading,
    reportsCount: reports.length
  });

  // Check admin access
  useEffect(() => {
    if (user && !user.isAdmin && user.userType !== 'admin') {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to access admin reports',
        variant: 'destructive'
      });
      navigate('/dashboard');
      return;
    }
  }, [user, navigate, toast]);

  const fetchReports = async () => {
    if (!user || (!user.isAdmin && user.userType !== 'admin')) {
      return;
    }
    
    try {
      setLoading(true);
      
      const queryParams = new URLSearchParams();
      if (statusFilter !== 'all') queryParams.append('status', statusFilter.toUpperCase());
      if (typeFilter !== 'all') queryParams.append('type', typeFilter.toUpperCase());
      
      const response = await apiService.getAdminReports(Object.fromEntries(queryParams.entries()));
      
      if (response.success && response.data) {
        const reportsData = response.data.reports || [];
        setReports(reportsData);
        
        setStats({
          total: reportsData.length,
          pending: reportsData.filter(r => r.status === 'PENDING').length,
          resolved: reportsData.filter(r => r.status === 'RESOLVED').length,
          dismissed: reportsData.filter(r => r.status === 'DISMISSED').length
        });
      } else {
        console.error('Failed to fetch reports:', response);
        setReports([]);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: 'Error', 
        description: `Failed to fetch reports: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive'
      });
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveReport = async (reportId: string, status: string) => {
    if (!resolution.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a resolution note',
        variant: 'destructive'
      });
      return;
    }

    setIsResolving(true);
    try {
      const response = await apiService.resolveReport(reportId, {
        status,
        resolution,
        action: (actionType && actionType !== 'dismiss') ? actionType : undefined
      });

      if (response.success) {
        toast({
          title: 'Report Resolved',
          description: `Report has been ${status.toLowerCase()} successfully`
        });
        handleCloseModal();
        fetchReports();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to resolve report',
        variant: 'destructive'
      });
    } finally {
      setIsResolving(false);
    }
  };

  const handleOpenModal = (report: Report) => {
    console.log('=== REVIEW BUTTON CLICKED ===');
    console.log('Opening modal for report:', report);
    console.log('Current modal state before:', isModalOpen);
    console.log('Current selected report before:', selectedReport);
    
    try {
      setSelectedReport(report);
      setIsModalOpen(true);
      console.log('Modal state set to: true');
      console.log('Selected report set to:', report);
      console.log('=== MODAL SHOULD BE VISIBLE ===');
    } catch (error) {
      console.error('Error opening modal:', error);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedReport(null);
    setResolution('');
    setActionType('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'RESOLVED':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Resolved</Badge>;
      case 'DISMISSED':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800"><X className="w-3 h-3 mr-1" />Dismissed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'USER':
        return <User className="w-4 h-4" />;
      case 'SERVICE':
        return <Settings className="w-4 h-4" />;
      case 'REVIEW':
        return <Star className="w-4 h-4" />;
      case 'MESSAGE':
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getReasonLabel = (reason: string) => {
    const reasons = {
      'SPAM': 'Spam',
      'INAPPROPRIATE': 'Inappropriate Content',
      'FRAUD': 'Suspected Fraud',
      'NO_SHOW': 'No Show / Cancellation Issue',
      'UNPROFESSIONAL': 'Unprofessional Behavior',
      'SAFETY': 'Safety Concern',
      'OTHER': 'Other'
    };
    return reasons[reason as keyof typeof reasons] || reason;
  };

  useEffect(() => {
    if (user && (user.isAdmin || user.userType === 'admin')) {
      fetchReports();
    }
  }, [user, statusFilter, typeFilter]);

  // Return early if not admin
  if (user && !user.isAdmin && user.userType !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }
  
  // Show loading state if user hasn't loaded yet
  if (!user) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">Loading reports...</div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Report Management</h1>
            <p className="text-muted-foreground">Review and moderate user reports</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Reports</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.resolved}</p>
                  <p className="text-sm text-muted-foreground">Resolved</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <X className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.dismissed}</p>
                  <p className="text-sm text-muted-foreground">Dismissed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label>Status Filter</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="dismissed">Dismissed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1">
                <Label>Type Filter</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="message">Message</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports List */}
        <Card>
          <CardHeader>
            <CardTitle>Reports ({reports.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {reports.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No reports found matching the current filters.
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <div key={report.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getTypeIcon(report.targetType)}
                          <span className="font-medium">{report.targetType} Report</span>
                          {getStatusBadge(report.status)}
                          <Badge variant="outline">{getReasonLabel(report.reason)}</Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-3">
                          <div>
                            <span className="font-medium">Reporter:</span> {report.reporter.profile.firstName} {report.reporter.profile.lastName}
                          </div>
                          <div>
                            <span className="font-medium">Target:</span> {report.targetUser?.profile?.firstName} {report.targetUser?.profile?.lastName} (ID: {report.targetId})
                          </div>
                          <div>
                            <span className="font-medium">Reported:</span> {formatDate(report.createdAt)}
                          </div>
                          {report.resolvedAt && (
                            <div>
                              <span className="font-medium">Resolved:</span> {formatDate(report.resolvedAt)}
                            </div>
                          )}
                        </div>
                        
                        {report.details && (
                          <div className="text-sm bg-muted p-3 rounded mb-3">
                            <span className="font-medium">Details:</span> {report.details}
                          </div>
                        )}
                        
                        {report.resolution && (
                          <div className="text-sm bg-green-50 border border-green-200 p-3 rounded">
                            <span className="font-medium text-green-800">Resolution:</span> {report.resolution}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleOpenModal(report)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Review
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal Overlay */}
        {(() => {
          console.log('Modal render check:', { isModalOpen, hasSelectedReport: !!selectedReport });
          return isModalOpen && selectedReport;
        })() && (
          <div 
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" 
            onClick={handleCloseModal}
          >
            <div 
              className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg sm:rounded-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col space-y-1.5 text-center sm:text-left">
                <h2 className="text-lg font-semibold leading-none tracking-tight">Review Report</h2>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Report Type</Label>
                    <p className="text-sm">{selectedReport.targetType}</p>
                  </div>
                  <div>
                    <Label>Reason</Label>
                    <p className="text-sm">{getReasonLabel(selectedReport.reason)}</p>
                  </div>
                </div>
                
                <div>
                  <Label>Reporter</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-xs">
                        {selectedReport.reporter.profile.firstName[0]}{selectedReport.reporter.profile.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{selectedReport.reporter.profile.firstName} {selectedReport.reporter.profile.lastName}</span>
                    <span className="text-xs text-muted-foreground">({selectedReport.reporter.email})</span>
                  </div>
                </div>
                
                {selectedReport.targetUser && (
                  <div>
                    <Label>Reported User</Label>
                    <div className="flex items-center gap-2 mt-1 mb-2">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-xs">
                          {selectedReport.targetUser.profile.firstName[0]}{selectedReport.targetUser.profile.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{selectedReport.targetUser.profile.firstName} {selectedReport.targetUser.profile.lastName}</span>
                      <span className="text-xs text-muted-foreground">({selectedReport.targetUser.email})</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={selectedReport.targetUser.warningCount >= 3 ? 'destructive' : 
                                    selectedReport.targetUser.warningCount >= 1 ? 'secondary' : 'outline'}>
                        {selectedReport.targetUser.warningCount} Warning{selectedReport.targetUser.warningCount !== 1 ? 's' : ''}
                      </Badge>
                      {selectedReport.targetUser.isBanned && (
                        <Badge variant="destructive">Banned</Badge>
                      )}
                      {selectedReport.targetUser.isSuspended && !selectedReport.targetUser.isBanned && (
                        <Badge variant="secondary">Suspended</Badge>
                      )}
                    </div>
                    {selectedReport.targetUser.warningCount >= 2 && (
                      <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                        ⚠️ This user has {selectedReport.targetUser.warningCount} warnings. 
                        {selectedReport.targetUser.warningCount === 2 ? ' One more warning will result in automatic suspension.' : ''}
                      </div>
                    )}
                  </div>
                )}
                
                {selectedReport.details && (
                  <div>
                    <Label>Additional Details</Label>
                    <div className="text-sm bg-muted p-3 rounded mt-1">
                      {selectedReport.details}
                    </div>
                  </div>
                )}
                
                {selectedReport.status === 'PENDING' && (
                  <>
                    <Separator />
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="resolution">Resolution Notes *</Label>
                        <Textarea
                          id="resolution"
                          value={resolution}
                          onChange={(e) => setResolution(e.target.value)}
                          placeholder="Describe your decision and any actions taken..."
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="action">Action Required</Label>
                        <Select value={actionType} onValueChange={setActionType}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an action..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dismiss">Dismiss (No action)</SelectItem>
                            <SelectItem value="warn">Issue Warning</SelectItem>
                            <SelectItem value="suspend">Temporary Suspension</SelectItem>
                            <SelectItem value="ban">Permanent Ban</SelectItem>
                            <SelectItem value="deactivate_services">Deactivate Services Only</SelectItem>
                          </SelectContent>
                        </Select>
                        {actionType === 'warn' && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Note: 3 warnings will result in automatic suspension
                          </p>
                        )}
                      </div>
                      
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={handleCloseModal}
                          disabled={isResolving}
                        >
                          Cancel
                        </Button>
                        {actionType === 'dismiss' || actionType === '' ? (
                          <Button
                            variant="outline"
                            onClick={() => handleResolveReport(selectedReport.id, 'DISMISSED')}
                            disabled={isResolving}
                          >
                            <X className="w-4 h-4 mr-2" />
                            {isResolving ? 'Dismissing...' : 'Dismiss Report'}
                          </Button>
                        ) : (
                          <Button
                            variant={actionType === 'ban' ? 'destructive' : 'default'}
                            onClick={() => handleResolveReport(selectedReport.id, 'RESOLVED')}
                            disabled={isResolving}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            {isResolving ? 'Processing...' : 
                             actionType === 'warn' ? 'Issue Warning' :
                             actionType === 'suspend' ? 'Suspend User' :
                             actionType === 'ban' ? 'Ban User' :
                             actionType === 'deactivate_services' ? 'Deactivate Services' :
                             'Resolve Report'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default AdminReportManagement;