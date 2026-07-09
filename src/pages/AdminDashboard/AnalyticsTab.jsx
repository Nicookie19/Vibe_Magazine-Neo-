// src/pages/AdminDashboard/AnalyticsTab.jsx
import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import StatCard from "./StatCard";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    Area,
    AreaChart
} from "recharts";

const AnalyticsTab = ({ magazines, submissions }) => {
    const [analytics, setAnalytics] = useState({
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0,
        totalSaves: 0,
        magazineStats: [],
        timelineData: [],
        engagementData: [],
        loading: true
    });
    const [selectedTimeRange, setSelectedTimeRange] = useState('7d');

    useEffect(() => {
        fetchAnalytics();
    }, [selectedTimeRange, magazines]);

    const fetchAnalytics = async () => {
        try {
            // Calculate date range based on selection
            const now = new Date();
            const daysBack = selectedTimeRange === '7d' ? 7 : selectedTimeRange === '30d' ? 30 : 90;
            const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));

            // Fetch all analytics data
            const { data, error } = await supabase
                .from('magazine_analytics')
                .select('*')
                .gte('created_at', startDate.toISOString());

            if (error) throw error;

            // Calculate totals by event type
            const totals = data.reduce((acc, event) => {
                acc[event.event_type] = (acc[event.event_type] || 0) + 1;
                return acc;
            }, {});

            // Group by magazine for individual magazine stats
            const magazineStats = magazines.map(magazine => {
                const magazineEvents = data.filter(event => event.magazine_id === magazine.id);
                const stats = magazineEvents.reduce((acc, event) => {
                    acc[event.event_type] = (acc[event.event_type] || 0) + 1;
                    return acc;
                }, {});

                const totalEngagement = (stats.visit || 0) + (stats.like || 0) + (stats.comment || 0) + (stats.save || 0);

                return {
                    id: magazine.id,
                    title: magazine.title.length > 20 ? magazine.title.substring(0, 20) + '...' : magazine.title,
                    fullTitle: magazine.title,
                    visits: stats.visit || 0,
                    likes: stats.like || 0,
                    comments: stats.comment || 0,
                    saves: stats.save || 0,
                    totalEngagement
                };
            }).sort((a, b) => b.totalEngagement - a.totalEngagement);

            // Create timeline data (daily aggregation)
            const timelineData = [];
            for (let i = daysBack - 1; i >= 0; i--) {
                const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
                const dateStr = date.toISOString().split('T')[0];
                const dayEvents = data.filter(event =>
                    event.created_at && event.created_at.split('T')[0] === dateStr
                );

                const dayStats = dayEvents.reduce((acc, event) => {
                    acc[event.event_type] = (acc[event.event_type] || 0) + 1;
                    return acc;
                }, {});

                timelineData.push({
                    date: dateStr,
                    day: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
                    visits: dayStats.visit || 0,
                    likes: dayStats.like || 0,
                    comments: dayStats.comment || 0,
                    saves: dayStats.save || 0,
                    total: (dayStats.visit || 0) + (dayStats.like || 0) + (dayStats.comment || 0) + (dayStats.save || 0)
                });
            }

            // Create engagement breakdown data for pie chart
            const engagementData = [
                { name: 'Views', value: totals.visit || 0, color: '#8884d8' },
                { name: 'Likes', value: totals.like || 0, color: '#82ca9d' },
                { name: 'Comments', value: totals.comment || 0, color: '#ffc658' },
                { name: 'Saves', value: totals.save || 0, color: '#ff7300' }
            ].filter(item => item.value > 0);

            setAnalytics({
                totalViews: totals.visit || 0,
                totalLikes: totals.like || 0,
                totalComments: totals.comment || 0,
                totalSaves: totals.save || 0,
                magazineStats,
                timelineData,
                engagementData,
                loading: false
            });
        } catch (error) {
            console.error('Error fetching analytics:', error);
            setAnalytics(prev => ({ ...prev, loading: false }));
        }
    };

    if (analytics.loading) {
        return (
            <div className="text-white text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
                <p className="mt-4">Loading analytics...</p>
            </div>
        );
    }

    const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff88'];

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
                <p className="text-gray-400">Comprehensive insights and performance metrics for your magazine platform</p>
            </div>

            <div className="space-y-6">
                {/* Time Range Selector */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 className="text-xl font-semibold text-white">Performance Overview</h2>
                    <div className="flex gap-2">
                        {['7d', '30d', '90d'].map((range) => (
                            <button
                                key={range}
                                onClick={() => setSelectedTimeRange(range)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedTimeRange === range
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                            >
                                {range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Formula Reference Section */}
                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold text-white">📊 VibeMagazine Analytics Formulas</h3>
                        <span className="text-sm text-gray-400">For Manual Computation Reference</span>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h4 className="text-lg font-medium text-purple-400">Metric Definitions:</h4>
                            <ul className="space-y-2 text-gray-300">
                                <li>• <span className="font-medium text-blue-400">Total Views</span> → How many times people opened or looked at the magazine</li>
                                <li>• <span className="font-medium text-green-400">Total Likes</span> → How many times people clicked "like" on the magazine</li>
                                <li>• <span className="font-medium text-yellow-400">Total Comments</span> → How many messages or feedback were written on the magazine</li>
                                <li>• <span className="font-medium text-orange-400">Total Saves</span> → How many times people saved the magazine to check later</li>
                            </ul>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-lg font-medium text-purple-400">Calculation Formulas:</h4>
                            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-600">
                                <div className="space-y-3 text-gray-300">
                                    <div>
                                        <span className="font-medium text-purple-400">Total Engagement:</span>
                                        <div className="text-sm mt-1 font-mono bg-gray-800 p-2 rounded">
                                            Views + Likes + Comments + Saves
                                        </div>
                                    </div>
                                    <div>
                                        <span className="font-medium text-purple-400">Engagement Rate (%):</span>
                                        <div className="text-sm mt-1 font-mono bg-gray-800 p-2 rounded">
                                            ((Likes + Comments + Saves) / Views) × 100
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-400 mt-2">
                                        <strong>Example:</strong> Views=100, Likes=10, Comments=5, Saves=5<br />
                                        Engagement Rate = ((10+5+5)/100) × 100 = 20%
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Overall Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <StatCard label="Total Magazines" value={magazines.length} />
                    <StatCard label="Total Views" value={analytics.totalViews} />
                    <StatCard label="Total Likes" value={analytics.totalLikes} />
                    <StatCard label="Total Comments" value={analytics.totalComments} />
                    <StatCard label="Total Saves" value={analytics.totalSaves} />
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Timeline Chart */}
                    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                        <h3 className="text-xl font-semibold text-white mb-4">Engagement Timeline</h3>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={analytics.timelineData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.6} />
                                    <XAxis
                                        dataKey="day"
                                        stroke="#D1D5DB"
                                        fontSize={11}
                                        tick={{ fill: '#D1D5DB' }}
                                        axisLine={{ stroke: '#6B7280' }}
                                    />
                                    <YAxis
                                        stroke="#D1D5DB"
                                        fontSize={11}
                                        tick={{ fill: '#D1D5DB' }}
                                        axisLine={{ stroke: '#6B7280' }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#111827',
                                            border: '1px solid #6366F1',
                                            borderRadius: '12px',
                                            boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                                        }}
                                        labelStyle={{ color: '#F9FAFB', fontWeight: 'bold' }}
                                        cursor={{ stroke: '#6366F1', strokeWidth: 2, strokeDasharray: '5 5' }}
                                    />
                                    <Legend
                                        wrapperStyle={{ paddingTop: '20px' }}
                                        iconType="line"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="visits"
                                        stroke="#8B5CF6"
                                        strokeWidth={3}
                                        name="Views"
                                        dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                                        activeDot={{ r: 6, stroke: '#8B5CF6', strokeWidth: 2, fill: '#FFFFFF' }}
                                        connectNulls
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="likes"
                                        stroke="#10B981"
                                        strokeWidth={3}
                                        name="Likes"
                                        dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                                        activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2, fill: '#FFFFFF' }}
                                        connectNulls
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="comments"
                                        stroke="#F59E0B"
                                        strokeWidth={3}
                                        name="Comments"
                                        dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
                                        activeDot={{ r: 6, stroke: '#F59E0B', strokeWidth: 2, fill: '#FFFFFF' }}
                                        connectNulls
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="saves"
                                        stroke="#EF4444"
                                        strokeWidth={3}
                                        name="Saves"
                                        dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
                                        activeDot={{ r: 6, stroke: '#EF4444', strokeWidth: 2, fill: '#FFFFFF' }}
                                        connectNulls
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Engagement Breakdown */}
                    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                        <h3 className="text-xl font-semibold text-white mb-4">Engagement Breakdown</h3>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={analytics.engagementData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {analytics.engagementData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1F2937',
                                            border: '1px solid #374151',
                                            borderRadius: '8px',
                                            color: '#FFFFFF'
                                        }}
                                        labelStyle={{ color: '#FFFFFF' }}
                                        itemStyle={{ color: '#FFFFFF' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Magazine Performance Bar Chart */}
                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">Magazine Performance Comparison</h3>
                    {analytics.magazineStats.length > 0 ? (
                        <div className="h-96">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={analytics.magazineStats.slice(0, 10)}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis
                                        dataKey="title"
                                        stroke="#9CA3AF"
                                        fontSize={12}
                                        angle={-45}
                                        textAnchor="end"
                                        height={80}
                                    />
                                    <YAxis stroke="#9CA3AF" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1F2937',
                                            border: '1px solid #374151',
                                            borderRadius: '8px'
                                        }}
                                        labelFormatter={(label) => {
                                            const magazine = analytics.magazineStats.find(m => m.title === label);
                                            return magazine ? magazine.fullTitle : label;
                                        }}
                                    />
                                    <Legend />
                                    <Bar dataKey="visits" fill="#8884d8" name="Views" />
                                    <Bar dataKey="likes" fill="#82ca9d" name="Likes" />
                                    <Bar dataKey="comments" fill="#ffc658" name="Comments" />
                                    <Bar dataKey="saves" fill="#ff7300" name="Saves" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-96 flex items-center justify-center">
                            <p className="text-gray-400">No analytics data available yet.</p>
                        </div>
                    )}
                </div>

                {/* Detailed Table */}
                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">Detailed Performance Table</h3>
                    {analytics.magazineStats.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-white">
                                <thead>
                                    <tr className="border-b border-gray-600">
                                        <th className="pb-2 font-semibold">Rank</th>
                                        <th className="pb-2 font-semibold">Magazine</th>
                                        <th className="pb-2 font-semibold text-center">Views</th>
                                        <th className="pb-2 font-semibold text-center">Likes</th>
                                        <th className="pb-2 font-semibold text-center">Comments</th>
                                        <th className="pb-2 font-semibold text-center">Saves</th>
                                        <th className="pb-2 font-semibold text-center">Total Engagement</th>
                                        <th className="pb-2 font-semibold text-center">Engagement Rate</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {analytics.magazineStats.map((magazine, index) => {
                                        const engagementRate = magazine.visits > 0
                                            ? (((magazine.likes + magazine.comments + magazine.saves) / magazine.visits) * 100).toFixed(1)
                                            : '0.0';

                                        return (
                                            <tr key={magazine.id} className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors">
                                                <td className="py-3 text-center">
                                                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${index === 0 ? 'bg-yellow-500 text-black' :
                                                        index === 1 ? 'bg-gray-400 text-black' :
                                                            index === 2 ? 'bg-orange-600 text-white' :
                                                                'bg-gray-600 text-white'
                                                        }`}>
                                                        {index + 1}
                                                    </span>
                                                </td>
                                                <td className="py-3 font-medium" title={magazine.fullTitle}>
                                                    {magazine.title}
                                                </td>
                                                <td className="py-3 text-center">{magazine.visits}</td>
                                                <td className="py-3 text-center text-green-400">{magazine.likes}</td>
                                                <td className="py-3 text-center text-blue-400">{magazine.comments}</td>
                                                <td className="py-3 text-center text-orange-400">{magazine.saves}</td>
                                                <td className="py-3 text-center font-semibold text-purple-400">
                                                    {magazine.totalEngagement}
                                                </td>
                                                <td className="py-3 text-center">
                                                    <span className={`font-medium ${parseFloat(engagementRate) >= 20 ? 'text-green-400' :
                                                        parseFloat(engagementRate) >= 10 ? 'text-yellow-400' :
                                                            'text-gray-400'
                                                        }`}>
                                                        {engagementRate}%
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-gray-400">No analytics data available yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AnalyticsTab;