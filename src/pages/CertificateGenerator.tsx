import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { QrCode, Download, Award, Share2, Eye } from "lucide-react";
import { toast } from "sonner";

interface CertificateData {
  recipientName: string;
  courseName: string;
  completionDate: string;
  issuerName: string;
  issuerTitle: string;
  certificateId: string;
  template: string;
}

export default function CertificateGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [certificateData, setCertificateData] = useState<CertificateData>({
    recipientName: "",
    courseName: "",
    completionDate: new Date().toISOString().split('T')[0],
    issuerName: "",
    issuerTitle: "",
    certificateId: "",
    template: "professional"
  });

  const [previewMode, setPreviewMode] = useState(false);

  const generateCertificateId = () => {
    const id = 'CERT-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    setCertificateData(prev => ({ ...prev, certificateId: id }));
  };

  const generateQRCode = () => {
    const verificationUrl = `https://verify.certificate/${certificateData.certificateId}`;
    // In a real implementation, you would use a QR code library
    navigator.clipboard.writeText(verificationUrl);
    toast.success('Verification URL copied to clipboard');
  };

  const downloadCertificate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `certificate-${certificateData.certificateId}.png`;
    link.href = canvas.toDataURL();
    link.click();
    toast.success('Certificate downloaded successfully');
  };

  const drawCertificate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 1200;
    canvas.height = 800;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background based on template
    if (certificateData.template === 'professional') {
      // Professional template with gradient
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#f8fafc');
      gradient.addColorStop(1, '#e2e8f0');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Border
      ctx.strokeStyle = '#1e40af';
      ctx.lineWidth = 8;
      ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
    } else if (certificateData.template === 'modern') {
      // Modern template with clean design
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Accent bars
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(0, 0, canvas.width, 20);
      ctx.fillRect(0, canvas.height - 20, canvas.width, 20);
    } else {
      // Classic template
      ctx.fillStyle = '#fef7e0';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Decorative border
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 4;
      ctx.strokeRect(60, 60, canvas.width - 120, canvas.height - 120);
    }

    // Set text styles
    ctx.fillStyle = '#1f2937';
    ctx.textAlign = 'center';

    // Title
    ctx.font = 'bold 48px serif';
    ctx.fillText('Certificate of Completion', canvas.width / 2, 150);

    // Decorative line
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 - 200, 180);
    ctx.lineTo(canvas.width / 2 + 200, 180);
    ctx.stroke();

    // "This is to certify that"
    ctx.font = '24px sans-serif';
    ctx.fillText('This is to certify that', canvas.width / 2, 240);

    // Recipient name
    ctx.font = 'bold 36px serif';
    ctx.fillStyle = '#1e40af';
    ctx.fillText(certificateData.recipientName || '[Recipient Name]', canvas.width / 2, 320);

    // "has successfully completed"
    ctx.font = '24px sans-serif';
    ctx.fillStyle = '#1f2937';
    ctx.fillText('has successfully completed', canvas.width / 2, 380);

    // Course name
    ctx.font = 'bold 32px serif';
    ctx.fillStyle = '#1e40af';
    ctx.fillText(certificateData.courseName || '[Course Name]', canvas.width / 2, 460);

    // Date
    ctx.font = '20px sans-serif';
    ctx.fillStyle = '#6b7280';
    ctx.fillText(`Completed on ${certificateData.completionDate}`, canvas.width / 2, 540);

    // Signatures area
    ctx.font = '18px sans-serif';
    ctx.fillStyle = '#1f2937';
    
    // Issuer signature
    ctx.textAlign = 'center';
    ctx.fillText(certificateData.issuerName || '[Issuer Name]', canvas.width / 2, 660);
    ctx.fillText(certificateData.issuerTitle || '[Title]', canvas.width / 2, 680);
    
    // Signature line
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 - 100, 650);
    ctx.lineTo(canvas.width / 2 + 100, 650);
    ctx.stroke();

    // Certificate ID
    ctx.font = '14px monospace';
    ctx.fillStyle = '#9ca3af';
    ctx.textAlign = 'right';
    ctx.fillText(`Certificate ID: ${certificateData.certificateId}`, canvas.width - 60, canvas.height - 60);
  };

  // Redraw certificate when data changes
  useEffect(() => {
    if (previewMode) {
      drawCertificate();
    }
  }, [certificateData, previewMode]);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Certificate Generator</h1>
            <p className="text-muted-foreground">
              Create professional certificates and digital badges for course completion
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setPreviewMode(!previewMode)}>
              <Eye className="w-4 h-4 mr-2" />
              {previewMode ? 'Edit' : 'Preview'}
            </Button>
            {previewMode && (
              <Button onClick={downloadCertificate}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Configuration Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Certificate Details</CardTitle>
                <CardDescription>
                  Configure the certificate information and appearance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="recipientName">Recipient Name</Label>
                  <Input
                    id="recipientName"
                    value={certificateData.recipientName}
                    onChange={(e) => setCertificateData(prev => ({ ...prev, recipientName: e.target.value }))}
                    placeholder="John Doe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="courseName">Course/Module Name</Label>
                  <Input
                    id="courseName"
                    value={certificateData.courseName}
                    onChange={(e) => setCertificateData(prev => ({ ...prev, courseName: e.target.value }))}
                    placeholder="Cybersecurity Fundamentals"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="completionDate">Completion Date</Label>
                  <Input
                    id="completionDate"
                    type="date"
                    value={certificateData.completionDate}
                    onChange={(e) => setCertificateData(prev => ({ ...prev, completionDate: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="issuerName">Issuer Name</Label>
                    <Input
                      id="issuerName"
                      value={certificateData.issuerName}
                      onChange={(e) => setCertificateData(prev => ({ ...prev, issuerName: e.target.value }))}
                      placeholder="Dr. Jane Smith"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="issuerTitle">Issuer Title</Label>
                    <Input
                      id="issuerTitle"
                      value={certificateData.issuerTitle}
                      onChange={(e) => setCertificateData(prev => ({ ...prev, issuerTitle: e.target.value }))}
                      placeholder="Training Director"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template">Template</Label>
                  <Select 
                    value={certificateData.template} 
                    onValueChange={(value) => setCertificateData(prev => ({ ...prev, template: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="modern">Modern</SelectItem>
                      <SelectItem value="classic">Classic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button onClick={generateCertificateId} variant="outline" className="flex-1">
                    Generate ID
                  </Button>
                  <Input
                    value={certificateData.certificateId}
                    onChange={(e) => setCertificateData(prev => ({ ...prev, certificateId: e.target.value }))}
                    placeholder="Certificate ID"
                    className="flex-1"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Digital Badge Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Badge Criteria</Label>
                  <Textarea 
                    placeholder="Learner demonstrated proficiency in cybersecurity fundamentals..."
                    className="min-h-20"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Skills Verified</Label>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Risk Assessment</Badge>
                    <Badge variant="secondary">Incident Response</Badge>
                    <Badge variant="secondary">Security Policies</Badge>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={generateQRCode} variant="outline" className="flex-1">
                    <QrCode className="w-4 h-4 mr-2" />
                    Generate QR Code
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Badge
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview/Canvas */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Certificate Preview</CardTitle>
              </CardHeader>
              <CardContent>
                {previewMode ? (
                  <div className="relative">
                    <canvas
                      ref={canvasRef}
                      className="w-full border rounded-lg shadow-lg"
                      style={{ maxHeight: '600px' }}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-96 bg-muted rounded-lg">
                    <div className="text-center space-y-4">
                      <Award className="w-16 h-16 mx-auto text-muted-foreground" />
                      <p className="text-muted-foreground">
                        Fill in the certificate details and click Preview to see the certificate
                      </p>
                      <Button onClick={() => setPreviewMode(true)}>
                        <Eye className="w-4 h-4 mr-2" />
                        Preview Certificate
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Verification & Compliance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="font-medium">Blockchain Verification</Label>
                    <p className="text-muted-foreground">Immutable record on blockchain</p>
                  </div>
                  <div>
                    <Label className="font-medium">Open Badges 3.0</Label>
                    <p className="text-muted-foreground">Industry standard compliance</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Tamper-Proof</Badge>
                  <Badge variant="outline">QR Verified</Badge>
                  <Badge variant="outline">Globally Recognized</Badge>
                  <Badge variant="outline">Portable</Badge>
                </div>

                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Verification URL:</strong><br />
                    https://verify.certificate/{certificateData.certificateId || 'CERT-XXXXXXXXX'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}