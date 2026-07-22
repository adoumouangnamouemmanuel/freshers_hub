"use client";

import { useEffect, useState } from "react";
import { getSystemHealthAction, getSystemMetricsAction } from "@/app/actions/system";
import { Activity, Database, Server, Clock, RefreshCw, AlertCircle, CheckCircle2, XCircle, Zap } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, BarChart, Bar } from "recharts";

export default function SystemHealthPage() {
  const [health, setHealth] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [healthData, metricsData] = await Promise.all([
        getSystemHealthAction(),
        getSystemMetricsAction()
      ]);
      setHealth(healthData);
      setMetrics(metricsData);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message || "Failed to load system health data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Poll every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !health) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error && !health) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-600 p-6 rounded-2xl flex flex-col items-center justify-center space-y-4">
          <AlertCircle className="w-12 h-12" />
          <h2 className="text-xl font-bold">Failed to connect to API</h2>
          <p>{error}</p>
          <button onClick={fetchData} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const getStatusIcon = (status: string) => {
    if (status === "healthy" || status === "connected") return <CheckCircle2 className="w-6 h-6 text-green-500" />;
    if (status === "degraded") return <AlertCircle className="w-6 h-6 text-yellow-500" />;
    return <XCircle className="w-6 h-6 text-red-500" />;
  };

  const chartData = metrics?.chartData || [];
  const liveStats = metrics?.liveStats || { totalRequestsToday: 0, averageLatencyMs: 0, success: 0, errors: 0 };
  
  // Prepare data for DB connections chart
  const dbConnsData = [
    { name: 'Active', value: parseInt(health?.database?.connections?.active || 0) },
    { name: 'Idle', value: parseInt(health?.database?.connections?.idle || 0) }
  ];

  // Prepare data for Memory pie chart
  const memoryUsage = parseFloat(health?.system?.memory_usage_percent || 0);
  const memoryData = [
    { name: 'Used', value: memoryUsage },
    { name: 'Free', value: 100 - memoryUsage }
  ];
  const memoryColors = ['#ec4899', '#f3f4f6'];

  // Prepare data for Traffic pie chart
  const trafficData = [
    { name: 'Success', value: liveStats.success || 0 },
    { name: 'Errors', value: liveStats.errors || 0 }
  ];
  const trafficColors = ['#10b981', '#ef4444'];

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1600px] mx-auto overflow-x-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground">System Health</h1>
          <p className="text-muted-foreground mt-1">Live infrastructure monitoring and traffic metrics</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground hidden sm:inline-block">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
          <button 
            onClick={fetchData} 
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl transition-colors font-medium cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Row 1: Infrastructure */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        
        {/* API Server */}
        <div className="glass-panel p-5 rounded-[var(--radius-xl)] border border-border flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-600">
                <Activity className="w-5 h-5" />
              </div>
              <h2 className="font-bold">Node.js Server</h2>
            </div>
            {getStatusIcon(health?.status || "disconnected")}
          </div>
          
          <div className="flex-1 grid grid-cols-2 gap-4 items-center">
            <div className="text-center border-r border-border">
              <p className="text-2xl font-bold font-mono">{health?.system?.uptime_seconds ? formatUptime(health.system.uptime_seconds) : "0m"}</p>
              <p className="text-xs text-muted-foreground mt-1">Uptime</p>
            </div>
            <div className="h-[80px] w-full relative flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={memoryData} cx="50%" cy="50%" innerRadius={25} outerRadius={35} paddingAngle={2} dataKey="value" stroke="none">
                    {memoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={memoryColors[index % memoryColors.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value) => `${parseFloat(value as string).toFixed(1)}%`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-[10px] font-bold">{memoryUsage.toFixed(0)}%</span>
              </div>
              <p className="text-[10px] text-muted-foreground absolute bottom-0">Heap Used</p>
            </div>
          </div>
        </div>

        {/* PostgreSQL */}
        <div className="glass-panel p-5 rounded-[var(--radius-xl)] border border-border flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-500/10 rounded-xl text-purple-600">
                <Database className="w-5 h-5" />
              </div>
              <h2 className="font-bold">PostgreSQL</h2>
            </div>
            {getStatusIcon(health?.database?.status || "disconnected")}
          </div>
          
          <div className="flex-1 grid grid-cols-2 gap-4 items-center">
            <div className="text-center border-r border-border">
              <p className="text-2xl font-bold font-mono">{health?.database?.latency_ms || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Latency (ms)</p>
            </div>
            <div className="h-[80px] w-full flex flex-col relative">
              <ResponsiveContainer width="100%" height="80%">
                <BarChart data={dbConnsData} layout="vertical" margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {dbConnsData.map((entry, index) => <Cell key={`cell-${index}`} fill={index === 0 ? '#8b5cf6' : '#c4b5fd'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p className="text-[10px] text-muted-foreground absolute bottom-0 w-full text-center">Connections</p>
            </div>
          </div>
        </div>

        {/* Redis Cache */}
        <div className="glass-panel p-5 rounded-[var(--radius-xl)] border border-border flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-500/10 rounded-xl text-red-600">
                <Server className="w-5 h-5" />
              </div>
              <h2 className="font-bold">Redis Cache</h2>
            </div>
            {getStatusIcon(health?.redis?.status || "disconnected")}
          </div>
          
          <div className="flex-1 flex flex-col justify-center items-center py-2">
             <div className={`text-2xl font-bold font-mono uppercase ${health?.redis?.status === 'connected' ? 'text-green-500' : 'text-red-500'}`}>
               {health?.redis?.status || "disconnected"}
             </div>
             <p className="text-xs text-muted-foreground mt-2">In-Memory Datastore</p>
          </div>
        </div>
      </div>

      {/* Row 2: Traffic */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Live Traffic */}
        <div className="glass-panel p-5 rounded-[var(--radius-xl)] border border-border flex flex-col lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-500/10 rounded-xl text-orange-600">
                <Zap className="w-5 h-5" />
              </div>
              <h2 className="font-bold">Today's Traffic</h2>
            </div>
          </div>
          
          <div className="h-[140px] w-full flex-1 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={trafficData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={60}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {trafficData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={trafficColors[index % trafficColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-bold">{liveStats.totalRequestsToday}</span>
            </div>
          </div>
          <div className="text-center text-sm font-medium mt-2 text-muted-foreground">
             Avg Latency: <span className="text-foreground">{liveStats.averageLatencyMs} ms</span>
          </div>
        </div>

        {/* Traffic Area Chart */}
        <div className="glass-panel p-5 rounded-[var(--radius-xl)] border border-border lg:col-span-3 flex flex-col">
          <h2 className="text-lg font-bold mb-6">Historical API Traffic (Last 7 Days)</h2>
        
        {chartData.length > 0 ? (
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="color200" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorError" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255,255,255,0.9)', 
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                  }} 
                />
                <Legend iconType="circle" />
                <Area 
                  type="monotone" 
                  dataKey="success" 
                  name="Success (2xx/3xx)"
                  stroke="#10b981" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#color200)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="clientError" 
                  name="Not Found (4xx)"
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorError)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="serverError" 
                  name="Server Error (5xx)"
                  stroke="#ef4444" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorError)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Activity className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No historical traffic data available yet.</p>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
