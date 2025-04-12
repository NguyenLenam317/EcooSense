import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ResponsiveLineChart, ResponsiveBarChart } from '@/lib/charts';
import { useUser } from '@/components/UserContext';

const Health = () => {
  const [activeTab, setActiveTab] = useState('air-quality');
  const { user } = useUser();
  
  // Fetch air quality data
  const { data: airQualityData, isLoading: airQualityLoading } = useQuery<AirQualityData>({
    queryKey: ['/api/weather/air-quality'],
    enabled: true,
  });
  
  // Fetch air quality forecast
  const { data: aqiForecastData, isLoading: aqiForecastLoading } = useQuery<any>({
    queryKey: ['/api/weather/air-quality/forecast'],
    enabled: activeTab === 'air-quality',
  });
  
  // Fetch health recommendations
  const { data: healthRecommendationsData, isLoading: healthRecommendationsLoading } = useQuery<any>({
    queryKey: ['/api/health/recommendations'],
    enabled: activeTab === 'recommendations',
  });
  
  // Fetch pollen data
  const { data: pollenData, isLoading: pollenLoading } = useQuery({
    queryKey: ['/api/weather/pollen'],
    enabled: activeTab === 'pollen',
  });

  // Helper function to get AQI category and color
  const getAQICategory = (aqi: number) => {
    if (aqi <= 50) return { label: "Good", color: "bg-green-100 text-green-800", progressColor: "bg-green-500" };
    if (aqi <= 100) return { label: "Moderate", color: "bg-yellow-100 text-yellow-800", progressColor: "bg-yellow-500" };
    if (aqi <= 150) return { label: "Unhealthy for Sensitive Groups", color: "bg-orange-100 text-orange-800", progressColor: "bg-orange-500" };
    if (aqi <= 200) return { label: "Unhealthy", color: "bg-red-100 text-red-800", progressColor: "bg-red-500" };
    if (aqi <= 300) return { label: "Very Unhealthy", color: "bg-purple-100 text-purple-800", progressColor: "bg-purple-500" };
    return { label: "Hazardous", color: "bg-rose-100 text-rose-800", progressColor: "bg-rose-800" };
  };
  
  // Format AQI forecast data for chart
  const formatAqiForecastData = (data: any) => {
    if (!data || !data.hourly) return [];
    
    return data.hourly.time.slice(0, 24).map((time: string, i: number) => ({
      name: new Date(time).getHours(),
      aqi: data.hourly.european_aqi[i],
      pm2_5: data.hourly.pm2_5[i],
      pm10: data.hourly.pm10[i],
    }));
  };
  
  // Format pollen data for chart
  const formatPollenData = (data: any) => {
    if (!data || !data.daily) return [];
    
    return data.daily.time.map((date: string, i: number) => ({
      name: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      grass: data.daily.grass_pollen[i],
      tree: data.daily.tree_pollen[i],
      weed: data.daily.weed_pollen[i],
    }));
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h2 className="text-2xl font-heading font-semibold mb-6">Health & Environment</h2>
        
        <Tabs defaultValue="air-quality" value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="air-quality">Air Quality</TabsTrigger>
            <TabsTrigger value="recommendations">Health Recommendations</TabsTrigger>
          </TabsList>
          
          <TabsContent value="air-quality" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Current Air Quality</CardTitle>
                  <CardDescription>Air quality index and pollutant levels in Hanoi</CardDescription>
                </CardHeader>
                <CardContent>
                  {airQualityLoading ? (
                    <Skeleton className="h-[200px] w-full" />
                  ) : (
                    <div className="flex flex-col md:flex-row items-center gap-8">
                      <div className="flex flex-col items-center">
                        <div className="relative w-40 h-40">
                          <svg className="w-full h-full" viewBox="0 0 100 100">
                            <circle 
                              className="text-neutral-200" 
                              strokeWidth="10" 
                              stroke="currentColor" 
                              fill="transparent" 
                              r="40" 
                              cx="50" 
                              cy="50"
                            />
                            <circle 
                              className={getAQICategory(airQualityData.current.aqi).progressColor}
                              strokeWidth="10" 
                              stroke="currentColor" 
                              fill="transparent" 
                              r="40" 
                              cx="50" 
                              cy="50"
                              strokeDasharray="251.2" 
                              strokeDashoffset={251.2 * (1 - Math.min(airQualityData.current.aqi / 300, 1))}
                              style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-medium">{airQualityData.current.aqi}</span>
                            <Badge className={getAQICategory(airQualityData.current.aqi).color}>
                              {getAQICategory(airQualityData.current.aqi).label}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-neutral-500 mt-2">Air Quality Index</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-x-12 gap-y-4 flex-grow">
                        <div>
                          <p className="text-sm text-neutral-500">PM2.5</p>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-medium">{airQualityData.current.pm2_5.toFixed(1)}</span>
                            <span className="text-xs text-neutral-500">μg/m³</span>
                          </div>
                          <Progress 
                            value={Math.min(airQualityData.current.pm2_5 / 50 * 100, 100)} 
                            className="h-1 mt-1"
                          />
                        </div>
                        <div>
                          <p className="text-sm text-neutral-500">PM10</p>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-medium">{airQualityData.current.pm10.toFixed(1)}</span>
                            <span className="text-xs text-neutral-500">μg/m³</span>
                          </div>
                          <Progress 
                            value={Math.min(airQualityData.current.pm10 / 100 * 100, 100)} 
                            className="h-1 mt-1"
                          />
                        </div>
                        <div>
                          <p className="text-sm text-neutral-500">NO₂</p>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-medium">{airQualityData.current.no2.toFixed(1)}</span>
                            <span className="text-xs text-neutral-500">μg/m³</span>
                          </div>
                          <Progress 
                            value={Math.min(airQualityData.current.no2 / 200 * 100, 100)} 
                            className="h-1 mt-1"
                          />
                        </div>
                        <div>
                          <p className="text-sm text-neutral-500">O₃</p>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-medium">{airQualityData.current.o3.toFixed(1)}</span>
                            <span className="text-xs text-neutral-500">μg/m³</span>
                          </div>
                          <Progress 
                            value={Math.min(airQualityData.current.o3 / 180 * 100, 100)} 
                            className="h-1 mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Health Impact</CardTitle>
                  <CardDescription>Based on current air quality</CardDescription>
                </CardHeader>
                <CardContent>
                  {airQualityLoading ? (
                    <Skeleton className="h-[200px] w-full" />
                  ) : (
                    <div className="space-y-4">
                      <div className={`p-4 rounded-lg ${getAQICategory(airQualityData.current.aqi).color.replace('text-', 'text-opacity-90 text-')}`}>
                        <h4 className="font-medium">General Population</h4>
                        <p className="text-sm mt-1">
                          {airQualityData.current.aqi <= 50 ? 
                            "Air quality is considered satisfactory, and air pollution poses little or no risk." :
                            airQualityData.current.aqi <= 100 ?
                            "Air quality is acceptable; however, there may be a moderate health concern for a very small number of people." :
                            airQualityData.current.aqi <= 150 ?
                            "Members of sensitive groups may experience health effects. The general public is not likely to be affected." :
                            "Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects."
                          }
                        </p>
                      </div>
                      
                      {user?.userProfile?.healthProfile?.hasRespiratoryConditions && (
                        <Alert variant="destructive">
                          <AlertTitle>Respiratory Condition Alert</AlertTitle>
                          <AlertDescription>
                            With your respiratory conditions, current air quality may affect your breathing. Consider limiting outdoor activities and using an air purifier.
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      {user?.userProfile?.healthProfile?.hasAllergies && airQualityData.current.aqi > 50 && (
                        <Alert>
                          <AlertTitle>Allergy Sensitivity</AlertTitle>
                          <AlertDescription>
                            Today's air quality may trigger your allergies. Keep medications handy and consider wearing a mask outdoors.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>24-Hour AQI Forecast</CardTitle>
                <CardDescription>Predicted air quality for the next 24 hours</CardDescription>
              </CardHeader>
              <CardContent>
                {aqiForecastLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <ResponsiveLineChart
                    data={formatAqiForecastData(aqiForecastData)}
                    lines={[
                      { key: 'aqi', color: '#1976d2', name: 'AQI' },
                      { key: 'pm2_5', color: '#f57c00', name: 'PM2.5 (μg/m³)' },
                      { key: 'pm10', color: '#43a047', name: 'PM10 (μg/m³)' },
                    ]}
                    height={300}
                    xAxisLabel="Hour of Day"
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="air-quality-historical" className="space-y-6">
            {aqiHistoricalLoading ? (
              <Skeleton className="h-[400px] w-full rounded-lg" />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Historical Air Quality</CardTitle>
                  <CardDescription>AQI trends over the past 30 days in Hanoi</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveLineChart
                    data={(aqiHistoricalData?.daily?.time || []).map((date: string, i: number) => ({
                      name: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                      aqi: aqiHistoricalData?.daily?.european_aqi_max[i] || 0,
                      pm2_5: aqiHistoricalData?.daily?.pm2_5_mean[i] || 0,
                      pm10: aqiHistoricalData?.daily?.pm10_mean[i] || 0,
                    }))}
                    lines={[
                      { key: 'aqi', color: '#1976d2', name: 'AQI' },
                      { key: 'pm2_5', color: '#f57c00', name: 'PM2.5 (μg/m³)' },
                      { key: 'pm10', color: '#43a047', name: 'PM10 (μg/m³)' },
                    ]}
                    height={400}
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="pollen" className="space-y-6">
            {pollenLoading ? (
              <>
                <Skeleton className="h-[300px] w-full rounded-lg mb-6" />
                <Skeleton className="h-[200px] w-full rounded-lg" />
              </>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Pollen Forecast</CardTitle>
                    <CardDescription>7-day pollen levels for Hanoi region</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveBarChart
                      data={formatPollenData(pollenData)}
                      bars={[
                        { key: 'grass', color: '#4caf50', name: 'Grass Pollen' },
                        { key: 'tree', color: '#8bc34a', name: 'Tree Pollen' },
                        { key: 'weed', color: '#cddc39', name: 'Weed Pollen' },
                      ]}
                      height={300}
                    />
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Personalized Pollen Impact</CardTitle>
                    <CardDescription>Based on your health profile</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {user?.userProfile?.healthProfile?.hasAllergies ? (
                      <div className="space-y-4">
                        <Alert>
                          <AlertTitle>You have indicated allergies in your profile</AlertTitle>
                          <AlertDescription>
                            Based on current pollen levels, here are some recommendations:
                          </AlertDescription>
                        </Alert>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 bg-yellow-50 rounded-lg">
                            <h4 className="font-medium flex items-center">
                              <span className="material-icons text-yellow-600 mr-1 text-sm">masks</span>
                              Protection Measures
                            </h4>
                            <ul className="list-disc list-inside text-sm text-neutral-700 mt-2 space-y-1">
                              <li>Wear sunglasses to protect eyes from pollen</li>
                              <li>Consider wearing a mask when outdoors</li>
                              <li>Change clothes after being outdoors</li>
                              <li>Shower before bedtime to remove pollen</li>
                            </ul>
                          </div>
                          
                          <div className="p-4 bg-blue-50 rounded-lg">
                            <h4 className="font-medium flex items-center">
                              <span className="material-icons text-blue-600 mr-1 text-sm">home</span>
                              Indoor Air Quality
                            </h4>
                            <ul className="list-disc list-inside text-sm text-neutral-700 mt-2 space-y-1">
                              <li>Keep windows closed during high pollen times</li>
                              <li>Use air conditioning with clean filters</li>
                              <li>Consider using a HEPA air purifier</li>
                              <li>Clean surfaces frequently to remove settled pollen</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center p-6 text-neutral-500">
                        <p>You have not indicated any pollen allergies in your profile.</p>
                        <p className="mt-2">Generally, pollen levels in Hanoi are moderate during this season.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="recommendations" className="space-y-6">
            {healthRecommendationsLoading ? (
              <>
                <Skeleton className="h-[100px] w-full rounded-lg mb-6" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Skeleton className="h-[300px] w-full rounded-lg" />
                  <Skeleton className="h-[300px] w-full rounded-lg" />
                  <Skeleton className="h-[300px] w-full rounded-lg" />
                </div>
              </>
            ) : (
              <>
                <Alert className="bg-primary-light bg-opacity-10 text-primary border-primary">
                  <AlertTitle className="text-primary">Personalized Health Recommendations</AlertTitle>
                  <AlertDescription className="text-primary-dark">
                    Based on current environmental conditions in Hanoi and your health profile
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <span className="material-icons text-primary mr-2">masks</span>
                        Respiratory Health
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {user?.userProfile?.healthProfile?.hasRespiratoryConditions ? (
                        <>
                          <div className="p-3 bg-yellow-50 rounded-lg">
                            <p className="text-sm">
                              With your respiratory conditions, current AQI of {airQualityData?.current?.aqi || 'N/A'} means you should:
                            </p>
                          </div>
                          <ul className="list-disc list-inside text-sm space-y-2">
                            <li>Limit outdoor activities, especially during peak traffic hours</li>
                            <li>Carry your rescue medications when going out</li>
                            <li>Wear a proper mask outdoors (N95 recommended)</li>
                            <li>Keep windows closed during poor air quality periods</li>
                            <li>Use air purifiers indoors if available</li>
                          </ul>
                        </>
                      ) : (
                        <p className="text-neutral-600">
                          Current air quality presents minimal respiratory risks for people without pre-existing conditions. General precautions are recommended during high pollution days.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <span className="material-icons text-primary mr-2">wb_sunny</span>
                        UV Protection
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span>UV Index:</span>
                        <Badge>
                          {healthRecommendationsData?.uv?.index || 'N/A'} - {healthRecommendationsData?.uv?.category || 'N/A'}
                        </Badge>
                      </div>
                      
                      <Progress 
                        value={(healthRecommendationsData?.uv?.index / 11) * 100 || 0} 
                        className="h-2"
                      />
                      
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm">
                          {user?.userProfile?.environmentalSensitivities?.uvSensitivity >= 4 
                            ? 'With your high UV sensitivity, extra protection is needed.'
                            : 'Recommended sun protection measures:'}
                        </p>
                      </div>
                      
                      <ul className="list-disc list-inside text-sm space-y-2">
                        <li>Use SPF {user?.userProfile?.environmentalSensitivities?.uvSensitivity >= 4 ? '50+' : '30+'} sunscreen</li>
                        <li>Wear a hat and sunglasses when outdoors</li>
                        <li>Seek shade during peak sun hours (10am-4pm)</li>
                        <li>Consider UV-protective clothing</li>
                      </ul>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <span className="material-icons text-primary mr-2">thermostat</span>
                        Temperature Adaptation
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span>Current Temperature:</span>
                        <Badge variant="outline">
                          {healthRecommendationsData?.temperature?.current || 'N/A'}°C
                        </Badge>
                      </div>
                      
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm">
                          {healthRecommendationsData?.temperature?.isHot 
                            ? 'High temperature alert - take precautions:'
                            : healthRecommendationsData?.temperature?.isCold
                            ? 'Cooler temperature - stay warm:'
                            : 'Comfortable temperature range today:'}
                        </p>
                      </div>
                      
                      <ul className="list-disc list-inside text-sm space-y-2">
                        {healthRecommendationsData?.temperature?.recommendations?.map((rec: string, index: number) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default Health;
