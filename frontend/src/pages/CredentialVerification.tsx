import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileText, GraduationCap, Briefcase, Users, Shield, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

interface Document {
  id: string;
  documentType: string;
  documentName: string;
  fileUrl: string;
  verificationStatus: string;
  verificationNotes?: string;
  uploadedAt: string;
}

interface Certification {
  id: string;
  certificationName: string;
  issuingOrganization: string;
  certificationNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  verificationStatus: string;
}

interface Education {
  id: string;
  institutionName: string;
  degreeType?: string;
  degreeTitle: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
  graduationStatus: string;
  verificationStatus: string;
}

interface Experience {
  id: string;
  organizationName: string;
  positionTitle: string;
  employmentType?: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  description?: string;
  verificationStatus: string;
}

interface Reference {
  id: string;
  referenceType: string;
  contactName: string;
  contactTitle?: string;
  organization?: string;
  relationship: string;
  email: string;
  phone?: string;
  referenceStatus: string;
}

const CredentialVerification: React.FC = () => {
  const { user } = useAuth();
  const [credentials, setCredentials] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Form states
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('');
  const [documentName, setDocumentName] = useState('');

  const [certificationForm, setCertificationForm] = useState({
    certificationName: '',
    issuingOrganization: '',
    certificationNumber: '',
    issueDate: '',
    expiryDate: '',
    verificationUrl: ''
  });

  const [educationForm, setEducationForm] = useState({
    institutionName: '',
    degreeType: '',
    degreeTitle: '',
    fieldOfStudy: '',
    startDate: '',
    endDate: '',
    graduationStatus: 'COMPLETED'
  });

  const [experienceForm, setExperienceForm] = useState({
    organizationName: '',
    positionTitle: '',
    employmentType: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    description: '',
    location: '',
    verificationContactName: '',
    verificationContactEmail: '',
    verificationContactPhone: ''
  });

  const [referenceForm, setReferenceForm] = useState({
    referenceType: 'PROFESSIONAL',
    contactName: '',
    contactTitle: '',
    organization: '',
    relationship: '',
    email: '',
    phone: '',
    yearsKnown: ''
  });

  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    try {
      const response = await apiService.request('/credentials/profile', { method: 'GET' });
      if (response.success) {
        setCredentials(response.data.credentials);
      }
    } catch (error) {
      console.error('Failed to fetch credentials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!uploadFile || !documentType || !documentName) {
      alert('Please fill all required fields');
      return;
    }

    const formData = new FormData();
    formData.append('document', uploadFile);
    formData.append('documentType', documentType);
    formData.append('documentName', documentName);

    try {
      const response = await fetch('/api/credentials/upload-document', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: formData
      });

      if (response.ok) {
        alert('Document uploaded successfully');
        setUploadFile(null);
        setDocumentType('');
        setDocumentName('');
        fetchCredentials();
      } else {
        alert('Failed to upload document');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload document');
    }
  };

  const addCertification = async () => {
    try {
      const response = await apiService.request('/credentials/certifications', {
        method: 'POST',
        body: JSON.stringify(certificationForm)
      });

      if (response.success) {
        alert('Certification added successfully');
        setCertificationForm({
          certificationName: '',
          issuingOrganization: '',
          certificationNumber: '',
          issueDate: '',
          expiryDate: '',
          verificationUrl: ''
        });
        fetchCredentials();
      }
    } catch (error) {
      console.error('Failed to add certification:', error);
      alert('Failed to add certification');
    }
  };

  const addEducation = async () => {
    try {
      const response = await apiService.request('/credentials/education', {
        method: 'POST',
        body: JSON.stringify(educationForm)
      });

      if (response.success) {
        alert('Education added successfully');
        setEducationForm({
          institutionName: '',
          degreeType: '',
          degreeTitle: '',
          fieldOfStudy: '',
          startDate: '',
          endDate: '',
          graduationStatus: 'COMPLETED'
        });
        fetchCredentials();
      }
    } catch (error) {
      console.error('Failed to add education:', error);
      alert('Failed to add education');
    }
  };

  const addExperience = async () => {
    try {
      const response = await apiService.request('/credentials/experience', {
        method: 'POST',
        body: JSON.stringify(experienceForm)
      });

      if (response.success) {
        alert('Experience added successfully');
        setExperienceForm({
          organizationName: '',
          positionTitle: '',
          employmentType: '',
          startDate: '',
          endDate: '',
          isCurrent: false,
          description: '',
          location: '',
          verificationContactName: '',
          verificationContactEmail: '',
          verificationContactPhone: ''
        });
        fetchCredentials();
      }
    } catch (error) {
      console.error('Failed to add experience:', error);
      alert('Failed to add experience');
    }
  };

  const addReference = async () => {
    try {
      const response = await apiService.request('/credentials/references', {
        method: 'POST',
        body: JSON.stringify(referenceForm)
      });

      if (response.success) {
        alert('Reference added successfully');
        setReferenceForm({
          referenceType: 'PROFESSIONAL',
          contactName: '',
          contactTitle: '',
          organization: '',
          relationship: '',
          email: '',
          phone: '',
          yearsKnown: ''
        });
        fetchCredentials();
      }
    } catch (error) {
      console.error('Failed to add reference:', error);
      alert('Failed to add reference');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'VERIFIED':
      case 'APPROVED':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'REJECTED':
      case 'DISQUALIFIED':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'PENDING':
      case 'IN_PROGRESS':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED':
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
      case 'DISQUALIFIED':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Credential Verification</h1>
        <p className="text-gray-600">Manage and verify your professional credentials</p>
      </div>

      {/* Verification Status Overview */}
      {credentials?.verificationChecklist && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Verification Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                {getStatusIcon(credentials.verificationChecklist.identityVerified ? 'VERIFIED' : 'PENDING')}
                <span className="text-sm">Identity</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(credentials.verificationChecklist.certificationsVerified ? 'VERIFIED' : 'PENDING')}
                <span className="text-sm">Certifications</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(credentials.verificationChecklist.educationVerified ? 'VERIFIED' : 'PENDING')}
                <span className="text-sm">Education</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(credentials.verificationChecklist.experienceVerified ? 'VERIFIED' : 'PENDING')}
                <span className="text-sm">Experience</span>
              </div>
            </div>
            <div className="mt-4">
              <Badge className={getStatusColor(credentials.verificationChecklist.overallStatus)}>
                {credentials.verificationChecklist.overallStatus}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="certifications">Certifications</TabsTrigger>
          <TabsTrigger value="education">Education</TabsTrigger>
          <TabsTrigger value="experience">Experience</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Documents:</span>
                  <span>{credentials?.documents?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Certifications:</span>
                  <span>{credentials?.certifications?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Education:</span>
                  <span>{credentials?.education?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Experience:</span>
                  <span>{credentials?.experience?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>References:</span>
                  <span>{credentials?.references?.length || 0}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Next Steps</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {!credentials?.documents?.length && (
                    <li className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Upload your credentials
                    </li>
                  )}
                  {!credentials?.certifications?.length && (
                    <li className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Add certifications
                    </li>
                  )}
                  {!credentials?.education?.length && (
                    <li className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      Add education background
                    </li>
                  )}
                  {!credentials?.experience?.length && (
                    <li className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Add work experience
                    </li>
                  )}
                  {!credentials?.references?.length && (
                    <li className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Add professional references
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documents">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upload Document</CardTitle>
                <CardDescription>
                  Upload credentials such as certifications, licenses, diplomas, or resumes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="documentType">Document Type</Label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={documentType}
                      onChange={(e) => setDocumentType(e.target.value)}
                    >
                      <option value="">Select type...</option>
                      <option value="CERTIFICATION">Certification</option>
                      <option value="LICENSE">License</option>
                      <option value="EDUCATION">Education Document</option>
                      <option value="INSURANCE">Insurance</option>
                      <option value="RESUME">Resume/CV</option>
                      <option value="REFERENCE">Reference Letter</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="documentName">Document Name</Label>
                    <Input
                      value={documentName}
                      onChange={(e) => setDocumentName(e.target.value)}
                      placeholder="e.g., Reiki Master Certification"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="file">File</Label>
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  />
                </div>
                <Button onClick={handleFileUpload} disabled={!uploadFile || !documentType || !documentName}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </Button>
              </CardContent>
            </Card>

            {credentials?.documents?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Uploaded Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {credentials.documents.map((doc: Document) => (
                      <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5" />
                          <div>
                            <div className="font-medium">{doc.documentName}</div>
                            <div className="text-sm text-gray-500">{doc.documentType}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(doc.verificationStatus)}
                          <Badge className={getStatusColor(doc.verificationStatus)}>
                            {doc.verificationStatus}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="certifications">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Add Certification</CardTitle>
                <CardDescription>
                  Add professional certifications and licenses
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Certification Name</Label>
                    <Input
                      value={certificationForm.certificationName}
                      onChange={(e) => setCertificationForm({...certificationForm, certificationName: e.target.value})}
                      placeholder="e.g., Reiki Master Certification"
                    />
                  </div>
                  <div>
                    <Label>Issuing Organization</Label>
                    <Input
                      value={certificationForm.issuingOrganization}
                      onChange={(e) => setCertificationForm({...certificationForm, issuingOrganization: e.target.value})}
                      placeholder="e.g., International Reiki Association"
                    />
                  </div>
                  <div>
                    <Label>Certification Number</Label>
                    <Input
                      value={certificationForm.certificationNumber}
                      onChange={(e) => setCertificationForm({...certificationForm, certificationNumber: e.target.value})}
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <Label>Issue Date</Label>
                    <Input
                      type="date"
                      value={certificationForm.issueDate}
                      onChange={(e) => setCertificationForm({...certificationForm, issueDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Expiry Date</Label>
                    <Input
                      type="date"
                      value={certificationForm.expiryDate}
                      onChange={(e) => setCertificationForm({...certificationForm, expiryDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Verification URL</Label>
                    <Input
                      value={certificationForm.verificationUrl}
                      onChange={(e) => setCertificationForm({...certificationForm, verificationUrl: e.target.value})}
                      placeholder="Optional verification link"
                    />
                  </div>
                </div>
                <Button onClick={addCertification}>
                  Add Certification
                </Button>
              </CardContent>
            </Card>

            {credentials?.certifications?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>My Certifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {credentials.certifications.map((cert: Certification) => (
                      <div key={cert.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium">{cert.certificationName}</div>
                            <div className="text-sm text-gray-600">{cert.issuingOrganization}</div>
                            {cert.certificationNumber && (
                              <div className="text-sm text-gray-500">#{cert.certificationNumber}</div>
                            )}
                            {cert.expiryDate && (
                              <div className="text-sm text-gray-500">
                                Expires: {new Date(cert.expiryDate).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                          <Badge className={getStatusColor(cert.verificationStatus)}>
                            {cert.verificationStatus}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="education">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Add Education</CardTitle>
                <CardDescription>
                  Add your educational background and qualifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Institution Name</Label>
                    <Input
                      value={educationForm.institutionName}
                      onChange={(e) => setEducationForm({...educationForm, institutionName: e.target.value})}
                      placeholder="e.g., University of California"
                    />
                  </div>
                  <div>
                    <Label>Degree Type</Label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={educationForm.degreeType}
                      onChange={(e) => setEducationForm({...educationForm, degreeType: e.target.value})}
                    >
                      <option value="">Select degree type...</option>
                      <option value="CERTIFICATE">Certificate</option>
                      <option value="DIPLOMA">Diploma</option>
                      <option value="BACHELOR">Bachelor's</option>
                      <option value="MASTER">Master's</option>
                      <option value="DOCTORATE">Doctorate</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div>
                    <Label>Degree Title</Label>
                    <Input
                      value={educationForm.degreeTitle}
                      onChange={(e) => setEducationForm({...educationForm, degreeTitle: e.target.value})}
                      placeholder="e.g., Bachelor of Science"
                    />
                  </div>
                  <div>
                    <Label>Field of Study</Label>
                    <Input
                      value={educationForm.fieldOfStudy}
                      onChange={(e) => setEducationForm({...educationForm, fieldOfStudy: e.target.value})}
                      placeholder="e.g., Psychology"
                    />
                  </div>
                  <div>
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={educationForm.startDate}
                      onChange={(e) => setEducationForm({...educationForm, startDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={educationForm.endDate}
                      onChange={(e) => setEducationForm({...educationForm, endDate: e.target.value})}
                    />
                  </div>
                </div>
                <Button onClick={addEducation}>
                  Add Education
                </Button>
              </CardContent>
            </Card>

            {credentials?.education?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Education History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {credentials.education.map((edu: Education) => (
                      <div key={edu.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium">{edu.degreeTitle}</div>
                            <div className="text-sm text-gray-600">{edu.institutionName}</div>
                            {edu.fieldOfStudy && (
                              <div className="text-sm text-gray-500">{edu.fieldOfStudy}</div>
                            )}
                            <div className="text-sm text-gray-500">
                              {edu.startDate && new Date(edu.startDate).getFullYear()} - {' '}
                              {edu.endDate ? new Date(edu.endDate).getFullYear() : 'Present'}
                            </div>
                          </div>
                          <Badge className={getStatusColor(edu.verificationStatus)}>
                            {edu.verificationStatus}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="experience">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Add Work Experience</CardTitle>
                <CardDescription>
                  Add your professional work experience and achievements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Organization Name</Label>
                    <Input
                      value={experienceForm.organizationName}
                      onChange={(e) => setExperienceForm({...experienceForm, organizationName: e.target.value})}
                      placeholder="e.g., Wellness Center"
                    />
                  </div>
                  <div>
                    <Label>Position Title</Label>
                    <Input
                      value={experienceForm.positionTitle}
                      onChange={(e) => setExperienceForm({...experienceForm, positionTitle: e.target.value})}
                      placeholder="e.g., Senior Healer"
                    />
                  </div>
                  <div>
                    <Label>Employment Type</Label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={experienceForm.employmentType}
                      onChange={(e) => setExperienceForm({...experienceForm, employmentType: e.target.value})}
                    >
                      <option value="">Select type...</option>
                      <option value="FULL_TIME">Full Time</option>
                      <option value="PART_TIME">Part Time</option>
                      <option value="CONTRACT">Contract</option>
                      <option value="VOLUNTEER">Volunteer</option>
                      <option value="SELF_EMPLOYED">Self Employed</option>
                    </select>
                  </div>
                  <div>
                    <Label>Location</Label>
                    <Input
                      value={experienceForm.location}
                      onChange={(e) => setExperienceForm({...experienceForm, location: e.target.value})}
                      placeholder="e.g., San Francisco, CA"
                    />
                  </div>
                  <div>
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={experienceForm.startDate}
                      onChange={(e) => setExperienceForm({...experienceForm, startDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={experienceForm.endDate}
                      onChange={(e) => setExperienceForm({...experienceForm, endDate: e.target.value})}
                      disabled={experienceForm.isCurrent}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={experienceForm.isCurrent}
                    onChange={(e) => setExperienceForm({...experienceForm, isCurrent: e.target.checked, endDate: e.target.checked ? '' : experienceForm.endDate})}
                  />
                  <Label>I currently work here</Label>
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={experienceForm.description}
                    onChange={(e) => setExperienceForm({...experienceForm, description: e.target.value})}
                    placeholder="Describe your role and responsibilities"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Verification Contact Name</Label>
                    <Input
                      value={experienceForm.verificationContactName}
                      onChange={(e) => setExperienceForm({...experienceForm, verificationContactName: e.target.value})}
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <Label>Verification Contact Email</Label>
                    <Input
                      value={experienceForm.verificationContactEmail}
                      onChange={(e) => setExperienceForm({...experienceForm, verificationContactEmail: e.target.value})}
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <Label>Verification Contact Phone</Label>
                    <Input
                      value={experienceForm.verificationContactPhone}
                      onChange={(e) => setExperienceForm({...experienceForm, verificationContactPhone: e.target.value})}
                      placeholder="Optional"
                    />
                  </div>
                </div>
                <Button onClick={addExperience}>
                  Add Experience
                </Button>
              </CardContent>
            </Card>

            {credentials?.experience?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Work Experience</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {credentials.experience.map((exp: Experience) => (
                      <div key={exp.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium">{exp.positionTitle}</div>
                            <div className="text-sm text-gray-600">{exp.organizationName}</div>
                            <div className="text-sm text-gray-500">
                              {new Date(exp.startDate).toLocaleDateString()} - {' '}
                              {exp.endDate ? new Date(exp.endDate).toLocaleDateString() : 'Present'}
                            </div>
                            {exp.description && (
                              <div className="text-sm text-gray-600 mt-1">{exp.description}</div>
                            )}
                          </div>
                          <Badge className={getStatusColor(exp.verificationStatus)}>
                            {exp.verificationStatus}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CredentialVerification;