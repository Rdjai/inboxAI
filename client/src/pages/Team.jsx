import React from 'react';
import { Users, Mail, Clock, Award, Plus, MoreVertical } from 'lucide-react';

const Team = () => {
    const teamMembers = [
        {
            id: 1,
            name: 'John Doe',
            email: 'john@inboxai.com',
            role: 'Admin',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
            status: 'active',
            emails: 245,
            avgResponse: '1.8h',
        },
        {
            id: 2,
            name: 'Jane Smith',
            email: 'jane@inboxai.com',
            role: 'Reviewer',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane',
            status: 'active',
            emails: 198,
            avgResponse: '2.1h',
        },
        {
            id: 3,
            name: 'Bob Johnson',
            email: 'bob@inboxai.com',
            role: 'Agent',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
            status: 'active',
            emails: 176,
            avgResponse: '2.4h',
        },
        {
            id: 4,
            name: 'Alice Brown',
            email: 'alice@inboxai.com',
            role: 'Agent',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
            status: 'away',
            emails: 210,
            avgResponse: '1.9h',
        },
        {
            id: 5,
            name: 'Charlie Wilson',
            email: 'charlie@inboxai.com',
            role: 'Agent',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=charlie',
            status: 'offline',
            emails: 152,
            avgResponse: '2.8h',
        },
    ];

    const roleStats = [
        { role: 'Admin', count: 1, color: 'bg-purple-100 text-purple-800' },
        { role: 'Reviewer', count: 2, color: 'bg-blue-100 text-blue-800' },
        { role: 'Agent', count: 5, color: 'bg-green-100 text-green-800' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Team</h1>
                    <p className="text-gray-600 mt-2">Manage your team members and roles</p>
                </div>
                <button className="btn-primary">
                    <Plus className="h-5 w-5 mr-2" />
                    Add Team Member
                </button>
            </div>

            {/* Role Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {roleStats.map((stat, index) => (
                    <div key={index} className="card">
                        <div className="flex items-center space-x-3">
                            <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${stat.color}`}>
                                <Users className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold">{stat.count}</h3>
                                <p className="text-gray-600">{stat.role}s</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Team Members */}
            <div className="card">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">Team Members ({teamMembers.length})</h2>
                    <div className="flex items-center space-x-2">
                        <select className="select-field w-48">
                            <option>Filter by Role</option>
                            <option>Admin</option>
                            <option>Reviewer</option>
                            <option>Agent</option>
                        </select>
                        <select className="select-field w-48">
                            <option>Filter by Status</option>
                            <option>Active</option>
                            <option>Away</option>
                            <option>Offline</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left py-3 px-4 font-medium text-gray-700">Member</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700">Role</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700">Emails</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700">Avg Response</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {teamMembers.map((member) => (
                                <tr key={member.id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="py-3 px-4">
                                        <div className="flex items-center space-x-3">
                                            <img
                                                src={member.avatar}
                                                alt={member.name}
                                                className="h-10 w-10 rounded-full"
                                            />
                                            <div>
                                                <p className="font-medium">{member.name}</p>
                                                <p className="text-sm text-gray-500">{member.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${member.role === 'Admin' ? 'bg-purple-100 text-purple-800' :
                                                member.role === 'Reviewer' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-green-100 text-green-800'
                                            }`}>
                                            {member.role}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center">
                                            <div className={`h-2 w-2 rounded-full mr-2 ${member.status === 'active' ? 'bg-green-500' :
                                                    member.status === 'away' ? 'bg-yellow-500' :
                                                        'bg-gray-500'
                                                }`}></div>
                                            <span className="capitalize">{member.status}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center">
                                            <Mail className="h-4 w-4 text-gray-400 mr-2" />
                                            <span className="font-medium">{member.emails}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center">
                                            <Clock className="h-4 w-4 text-gray-400 mr-2" />
                                            <span>{member.avgResponse}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center space-x-2">
                                            <button className="btn-secondary px-3 py-1 text-sm">
                                                Edit
                                            </button>
                                            <button className="p-2 hover:bg-gray-100 rounded">
                                                <MoreVertical className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Performance Leaderboard */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                    <h3 className="font-semibold text-lg mb-4">Top Performers</h3>
                    <div className="space-y-4">
                        {teamMembers
                            .sort((a, b) => b.emails - a.emails)
                            .slice(0, 3)
                            .map((member, index) => (
                                <div key={member.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                                            <Award className="h-5 w-5 text-primary-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{member.name}</p>
                                            <p className="text-sm text-gray-500">{member.role}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-lg">{member.emails}</p>
                                        <p className="text-sm text-gray-500">emails handled</p>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>

                <div className="card">
                    <h3 className="font-semibold text-lg mb-4">Quick Stats</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <Mail className="h-5 w-5 text-gray-500" />
                                <span>Total Emails Handled</span>
                            </div>
                            <span className="font-bold">981</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <Clock className="h-5 w-5 text-gray-500" />
                                <span>Avg Team Response Time</span>
                            </div>
                            <span className="font-bold">2.2h</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <Award className="h-5 w-5 text-gray-500" />
                                <span>Team Satisfaction Score</span>
                            </div>
                            <span className="font-bold">94%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Team;