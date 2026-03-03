import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, TrendingUp, Users, BarChart3, AlertTriangle } from 'lucide-react';

interface MarketResearchData {
  market_overview?: string;
  market_size?: string;
  growth_rate?: string;
  key_trends?: string[];
  competitive_landscape?: string;
  target_audience_analysis?: string;
  demand_drivers?: string[];
  market_challenges?: string[];
}

interface MarketResearchViewProps {
  data: MarketResearchData;
}

export function MarketResearchView({ data }: MarketResearchViewProps) {
  return (
    <div className="space-y-4">
      {/* Key Metrics Row */}
      {(data.market_size || data.growth_rate) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {data.market_size && (
            <Card>
              <CardContent className="pt-4 flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Market Size</div>
                  <div className="font-semibold">{data.market_size}</div>
                </div>
              </CardContent>
            </Card>
          )}
          {data.growth_rate && (
            <Card>
              <CardContent className="pt-4 flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Growth Rate</div>
                  <div className="font-semibold">{data.growth_rate}</div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Market Overview */}
      {data.market_overview && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              Market Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">{data.market_overview}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Key Trends */}
        {data.key_trends && data.key_trends.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Key Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {data.key_trends.map((trend, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 shrink-0" />
                    <span>{trend}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Demand Drivers */}
        {data.demand_drivers && data.demand_drivers.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                Demand Drivers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {data.demand_drivers.map((driver, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 shrink-0" />
                    <span>{driver}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Competitive Landscape */}
      {data.competitive_landscape && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Competitive Landscape
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">{data.competitive_landscape}</p>
          </CardContent>
        </Card>
      )}

      {/* Target Audience */}
      {data.target_audience_analysis && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Target Audience
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">{data.target_audience_analysis}</p>
          </CardContent>
        </Card>
      )}

      {/* Market Challenges */}
      {data.market_challenges && data.market_challenges.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Market Challenges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.market_challenges.map((challenge, i) => (
                <Badge key={i} variant="outline" className="text-xs py-1.5 px-3">
                  {challenge}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
