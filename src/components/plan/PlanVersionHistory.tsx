import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  History, 
  Clock, 
  RotateCcw,
  Eye,
  ChevronDown,
  ChevronRight,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';

interface PlanVersion {
  id: string;
  version_number: number;
  plan_data: any;
  created_by?: string;
  created_at: string;
  change_notes?: string;
}

interface PlanVersionHistoryProps {
  versions: PlanVersion[];
  currentVersion?: number;
  onRestoreVersion?: (version: PlanVersion) => void;
  onPreviewVersion?: (version: PlanVersion) => void;
  isLoading?: boolean;
}

export const PlanVersionHistory = ({
  versions,
  currentVersion,
  onRestoreVersion,
  onPreviewVersion,
  isLoading = false,
}: PlanVersionHistoryProps) => {
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);

  const sortedVersions = [...versions].sort((a, b) => b.version_number - a.version_number);

  const toggleExpand = (versionId: string) => {
    setExpandedVersion(prev => prev === versionId ? null : versionId);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Version History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">
            Loading version history...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (versions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Version History
          </CardTitle>
          <CardDescription>
            Track changes to your training plan over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">
            <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No version history yet</p>
            <p className="text-xs">Versions will be created when you save changes</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Version History
          <Badge variant="secondary">{versions.length} versions</Badge>
        </CardTitle>
        <CardDescription>
          Track changes and restore previous versions of your plan
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {sortedVersions.map((version, idx) => {
              const isCurrent = version.version_number === currentVersion;
              const isExpanded = expandedVersion === version.id;
              
              return (
                <div
                  key={version.id}
                  className={`border rounded-lg transition-colors ${
                    isCurrent ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                  }`}
                >
                  <div
                    className="p-3 cursor-pointer"
                    onClick={() => toggleExpand(version.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              Version {version.version_number}
                            </span>
                            {isCurrent && (
                              <Badge className="bg-primary">Current</Badge>
                            )}
                            {idx === 0 && !isCurrent && (
                              <Badge variant="outline">Latest</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {format(new Date(version.created_at), 'MMM d, yyyy h:mm a')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {onPreviewVersion && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onPreviewVersion(version);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        {onRestoreVersion && !isCurrent && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRestoreVersion(version);
                            }}
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Restore
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <>
                      <Separator />
                      <div className="p-3 space-y-3">
                        {version.change_notes && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              Change Notes
                            </p>
                            <p className="text-sm">{version.change_notes}</p>
                          </div>
                        )}
                        
                        {version.plan_data && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">
                              Snapshot
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              {version.plan_data.title && (
                                <div className="flex items-center gap-2">
                                  <FileText className="h-3 w-3 text-muted-foreground" />
                                  <span className="truncate">{version.plan_data.title}</span>
                                </div>
                              )}
                              {version.plan_data.modules && (
                                <div>
                                  <span className="text-muted-foreground">Modules: </span>
                                  {version.plan_data.modules.length}
                                </div>
                              )}
                              {version.plan_data.budget_breakdown && (
                                <div>
                                  <span className="text-muted-foreground">Budget Items: </span>
                                  {Object.keys(version.plan_data.budget_breakdown).length}
                                </div>
                              )}
                              {version.plan_data.kpis && (
                                <div>
                                  <span className="text-muted-foreground">KPIs: </span>
                                  {version.plan_data.kpis.length}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
