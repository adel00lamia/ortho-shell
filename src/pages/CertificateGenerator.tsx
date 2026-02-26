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
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { t } = useLanguage();
  const c = t.certificates;

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

    canvas.width = 1200;
    canvas.height = 800;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (certificateData.template === 'professional') {
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#f8fafc');
      gradient.addColorStop(1, '#e2e8f0');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#1e40af';
      ctx.lineWidth = 8;
      ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
    } else if (certificateData.template === 'modern') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(0, 0, canvas.width, 20);
      ctx.fillRect(0, canvas.height - 20, canvas.width, 20);
    } else {
      ctx.fillStyle = '#fef7e0';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 4;
      ctx.strokeRect(60, 60, canvas.width - 120, canvas.height - 120);
    }

    ctx.fillStyle = '#1f2937';
    ctx.textAlign = 'center';
    ctx.font = 'bold 48px serif';
    ctx.fillText('Certificate of Completion', canvas.width / 2, 150);
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 - 200, 180);
    ctx.lineTo(canvas.width / 2 + 200, 180);
    ctx.stroke();
    ctx.font = '24px sans-serif';
    ctx.fillText('This is to certify that', canvas.width / 2, 240);
    ctx.font = 'bold 36px serif';
    ctx.fillStyle = '#1e40af';
    ctx.fillText(certificateData.recipientName || '[Recipient Name]', canvas.width / 2, 320);
    ctx.font = '24px sans-serif';
    ctx.fillStyle = '#1f2937';
    ctx.fillText('has successfully completed', canvas.width / 2, 380);
    ctx.font = 'bold 32px serif';
    ctx.fillStyle = '#1e40af';
    ctx.fillText(certificateData.courseName || '[Course Name]', canvas.width / 2, 460);
    ctx.font = '20px sans-serif';
    ctx.fillStyle = '#6b7280';
    ctx.fillText(`Completed on ${certificateData.completionDate}`, canvas.width / 2, 540);
    ctx.font = '18px sans-serif';
    ctx.fillStyle = '#1f2937';
    ctx.textAlign = 'center';
    ctx.fillText(certificateData.issuerName || '[Issuer Name]', canvas.width / 2, 660);
    ctx.fillText(certificateData.issuerTitle || '[Title]', canvas.width / 2, 680);
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 - 100, 650);
    ctx.lineTo(canvas.width / 2 + 100, 650);
    ctx.stroke();
    ctx.font = '14px monospace';
    ctx.fillStyle = '#9ca3af';
    ctx.textAlign = 'right';
    ctx.fillText(`Certificate ID: ${certificateData.certificateId}`, canvas.width - 60, canvas.height - 60);
  };

  useEffect(() => {
    if (previewMode) drawCertificate();
  }, [certificateData, previewMode]);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">{c.title}</h1>
            <p className="text-muted-foreground">{c.subtitle}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setPreviewMode(!previewMode)}>
              <Eye className="w-4 h-4 mr-2" />
              {previewMode ? t.common.edit : t.common.preview}
            </Button>
            {previewMode && (
              <Button onClick={downloadCertificate}>
                <Download className="w-4 h-4 mr-2" />
                {t.common.download}
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{c.certificateDetails}</CardTitle>
                <CardDescription>{c.certificateDetailsDesc}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="recipientName">{c.recipientName}</Label>
                  <Input id="recipientName" value={certificateData.recipientName} onChange={(e) => setCertificateData(prev => ({ ...prev, recipientName: e.target.value }))} placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="courseName">{c.courseModuleName}</Label>
                  <Input id="courseName" value={certificateData.courseName} onChange={(e) => setCertificateData(prev => ({ ...prev, courseName: e.target.value }))} placeholder="Cybersecurity Fundamentals" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="completionDate">{c.completionDate}</Label>
                  <Input id="completionDate" type="date" value={certificateData.completionDate} onChange={(e) => setCertificateData(prev => ({ ...prev, completionDate: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="issuerName">{c.issuerName}</Label>
                    <Input id="issuerName" value={certificateData.issuerName} onChange={(e) => setCertificateData(prev => ({ ...prev, issuerName: e.target.value }))} placeholder="Dr. Jane Smith" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="issuerTitle">{c.issuerTitle}</Label>
                    <Input id="issuerTitle" value={certificateData.issuerTitle} onChange={(e) => setCertificateData(prev => ({ ...prev, issuerTitle: e.target.value }))} placeholder="Training Director" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="template">{c.template}</Label>
                  <Select value={certificateData.template} onValueChange={(value) => setCertificateData(prev => ({ ...prev, template: value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">{c.professional}</SelectItem>
                      <SelectItem value="modern">{c.modern}</SelectItem>
                      <SelectItem value="classic">{c.classic}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button onClick={generateCertificateId} variant="outline" className="flex-1">{c.generateId}</Button>
                  <Input value={certificateData.certificateId} onChange={(e) => setCertificateData(prev => ({ ...prev, certificateId: e.target.value }))} placeholder={c.certificateId} className="flex-1" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  {c.digitalBadgeConfig}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{c.badgeCriteria}</Label>
                  <Textarea placeholder={c.badgeCriteriaPlaceholder} className="min-h-20" />
                </div>
                <div className="space-y-2">
                  <Label>{c.skillsVerified}</Label>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Risk Assessment</Badge>
                    <Badge variant="secondary">Incident Response</Badge>
                    <Badge variant="secondary">Security Policies</Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={generateQRCode} variant="outline" className="flex-1">
                    <QrCode className="w-4 h-4 mr-2" />
                    {c.generateQRCode}
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Share2 className="w-4 h-4 mr-2" />
                    {c.shareBadge}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{c.certificatePreview}</CardTitle>
              </CardHeader>
              <CardContent>
                {previewMode ? (
                  <div className="relative">
                    <canvas ref={canvasRef} className="w-full border rounded-lg shadow-lg" style={{ maxHeight: '600px' }} />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-96 bg-muted rounded-lg">
                    <div className="text-center space-y-4">
                      <Award className="w-16 h-16 mx-auto text-muted-foreground" />
                      <p className="text-muted-foreground">{c.fillDetailsPreview}</p>
                      <Button onClick={() => setPreviewMode(true)}>
                        <Eye className="w-4 h-4 mr-2" />
                        {c.previewCertificate}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{c.verificationCompliance}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="font-medium">{c.blockchainVerification}</Label>
                    <p className="text-muted-foreground">{c.blockchainDesc}</p>
                  </div>
                  <div>
                    <Label className="font-medium">{c.openBadges}</Label>
                    <p className="text-muted-foreground">{c.openBadgesDesc}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{c.tamperProof}</Badge>
                  <Badge variant="outline">{c.qrVerified}</Badge>
                  <Badge variant="outline">{c.globallyRecognized}</Badge>
                  <Badge variant="outline">{c.portable}</Badge>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>{c.verificationUrl}:</strong><br />
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
