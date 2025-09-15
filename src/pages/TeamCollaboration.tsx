import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  MessageSquare, 
  Calendar, 
  FolderOpen, 
  Plus,
  Video,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Star
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Team {
  id: string;
  name: string;
  description: string;
  members: number;
  projects: number;
  status: 'active' | 'completed' | 'on-hold';
  lead: string;
  avatar: string;
}

interface Project {
  id: string;
  title: string;
  description: string;
  team: string;
  status: 'planning' | 'in-progress' | 'review' | 'completed';
  progress: number;
  deadline: string;
  priority: 'low' | 'medium' | 'high';
  members: string[];
}

const TeamCollaboration = () => {
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const { toast } = useToast();

  // Mock data
  const teams: Team[] = [
    {
      id: '1',
      name: 'Frontend Development',
      description: 'React and UI development team',
      members: 8,
      projects: 3,
      status: 'active',
      lead: 'Sarah Johnson',
      avatar: '/api/placeholder/40/40'
    },
    {
      id: '2',
      name: 'Data Science',
      description: 'AI and machine learning specialists',
      members: 5,
      projects: 2,
      status: 'active',
      lead: 'Michael Chen',
      avatar: '/api/placeholder/40/40'
    },
    {
      id: '3',
      name: 'Marketing Strategy',
      description: 'Digital marketing and growth team',
      members: 6,
      projects: 4,
      status: 'active',
      lead: 'Emily Rodriguez',
      avatar: '/api/placeholder/40/40'
    }
  ];

  const projects: Project[] = [
    {
      id: '1',
      title: 'New Learning Platform UI',
      description: 'Redesign the main learning interface',
      team: 'Frontend Development',
      status: 'in-progress',
      progress: 65,
      deadline: '2024-02-15',
      priority: 'high',
      members: ['Sarah', 'Mike', 'Lisa']
    },
    {
      id: '2',
      title: 'AI Course Recommendation Engine',
      description: 'Build ML model for personalized course suggestions',
      team: 'Data Science',
      status: 'planning',
      progress: 25,
      deadline: '2024-03-01',
      priority: 'medium',
      members: ['Michael', 'Anna', 'David']
    },
    {
      id: '3',
      title: 'Q1 Marketing Campaign',
      description: 'Launch awareness campaign for new features',
      team: 'Marketing Strategy',
      status: 'review',
      progress: 90,
      deadline: '2024-01-30',
      priority: 'high',
      members: ['Emily', 'John', 'Kate']
    }
  ];

  const discussions = [
    {
      id: '1',
      title: 'UI Design Review Meeting',
      author: 'Sarah Johnson',
      lastMessage: 'Updated the color scheme based on feedback',
      timestamp: '2 hours ago',
      replies: 12,
      team: 'Frontend Development'
    },
    {
      id: '2',
      title: 'Dataset Preparation Guidelines',
      author: 'Michael Chen',
      lastMessage: 'Added new preprocessing steps',
      timestamp: '4 hours ago',
      replies: 8,
      team: 'Data Science'
    },
    {
      id: '3',
      title: 'Campaign Performance Metrics',
      author: 'Emily Rodriguez',
      lastMessage: 'Great improvement in conversion rates!',
      timestamp: '1 day ago',
      replies: 15,
      team: 'Marketing Strategy'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'on-hold': return 'bg-yellow-100 text-yellow-800';
      case 'planning': return 'bg-purple-100 text-purple-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'review': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCreateTeam = () => {
    toast({
      title: "Team created successfully",
      description: "New team has been added to the workspace.",
    });
    setIsCreateTeamOpen(false);
  };

  const handleCreateProject = () => {
    toast({
      title: "Project created successfully",
      description: "New project has been added to the team.",
    });
    setIsCreateProjectOpen(false);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Team Collaboration</h1>
          <p className="text-muted-foreground">Manage teams, projects, and collaborative work</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateProjectOpen} onOpenChange={setIsCreateProjectOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FolderOpen className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Set up a new collaborative project for your team.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="projectTitle">Project Title</Label>
                  <Input id="projectTitle" placeholder="Enter project title" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectDesc">Description</Label>
                  <Textarea id="projectDesc" placeholder="Describe the project goals and scope" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="team">Team</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select team" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map(team => (
                          <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input id="deadline" type="date" />
                </div>
                <Button onClick={handleCreateProject} className="w-full">
                  Create Project
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateTeamOpen} onOpenChange={setIsCreateTeamOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Team
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Team</DialogTitle>
                <DialogDescription>
                  Set up a new team for collaborative projects and learning.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="teamName">Team Name</Label>
                  <Input id="teamName" placeholder="Enter team name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teamDesc">Description</Label>
                  <Textarea id="teamDesc" placeholder="Describe the team's purpose and goals" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teamLead">Team Lead</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select team lead" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sarah">Sarah Johnson</SelectItem>
                      <SelectItem value="michael">Michael Chen</SelectItem>
                      <SelectItem value="emily">Emily Rodriguez</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreateTeam} className="w-full">
                  Create Team
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="teams" className="space-y-4">
        <TabsList>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="discussions">Discussions</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="teams" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => (
              <Card key={team.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={team.avatar} />
                      <AvatarFallback>{team.name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{team.name}</CardTitle>
                      <CardDescription>{team.description}</CardDescription>
                    </div>
                    <Badge className={getStatusColor(team.status)}>
                      {team.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Team Lead</span>
                      <span className="font-medium">{team.lead}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Members</span>
                      <span className="font-medium">{team.members}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Active Projects</span>
                      <span className="font-medium">{team.projects}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" className="flex-1">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Chat
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Video className="h-4 w-4 mr-2" />
                      Meet
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <div className="grid gap-4">
            {projects.map((project) => (
              <Card key={project.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">{project.title}</CardTitle>
                      <CardDescription>{project.description}</CardDescription>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{project.team}</span>
                        <Clock className="h-4 w-4 ml-2" />
                        <span>Due {project.deadline}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getPriorityColor(project.priority)}>
                        {project.priority}
                      </Badge>
                      <Badge className={getStatusColor(project.status)}>
                        {project.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Progress</span>
                        <span>{project.progress}%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all" 
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Team members:</span>
                      <div className="flex gap-1">
                        {project.members.map((member, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {member}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button size="sm" variant="outline">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Discuss
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="discussions" className="space-y-4">
          <div className="grid gap-4">
            {discussions.map((discussion) => (
              <Card key={discussion.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{discussion.title}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>by {discussion.author}</span>
                        <span>•</span>
                        <span>{discussion.team}</span>
                        <span>•</span>
                        <span>{discussion.timestamp}</span>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {discussion.replies} replies
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{discussion.lastMessage}</p>
                  <Button size="sm">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Join Discussion
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Calendar</CardTitle>
              <CardDescription>Upcoming meetings, deadlines, and events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <div className="font-medium">Frontend Team Standup</div>
                    <div className="text-sm text-muted-foreground">Today, 9:00 AM</div>
                  </div>
                  <Button size="sm">Join</Button>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <div className="font-medium">Project Review Meeting</div>
                    <div className="text-sm text-muted-foreground">Tomorrow, 2:00 PM</div>
                  </div>
                  <Button size="sm" variant="outline">Schedule</Button>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  <div className="flex-1">
                    <div className="font-medium">Q1 Campaign Deadline</div>
                    <div className="text-sm text-muted-foreground">Jan 30, 2024</div>
                  </div>
                  <Badge className="bg-orange-100 text-orange-800">Due Soon</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeamCollaboration;