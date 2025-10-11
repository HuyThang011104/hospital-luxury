import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Separator } from '../ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Settings, User, Bell, Shield, Database, Palette, Save } from 'lucide-react';

export function SettingsPage() {
    const [notifications, setNotifications] = useState({
        email: true,
        sms: false,
        push: true,
        appointments: true,
        emergencies: true,
        reports: false
    });

    const [privacy, setPrivacy] = useState({
        dataSharing: false,
        analytics: true,
        marketing: false
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1>Settings</h1>
                    <p className="text-muted-foreground">
                        Manage your hospital system configuration and preferences
                    </p>
                </div>
            </div>

            <Tabs defaultValue="profile" className="space-y-4">
                <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="profile" className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="flex items-center">
                        <Bell className="mr-2 h-4 w-4" />
                        Notifications
                    </TabsTrigger>
                    <TabsTrigger value="security" className="flex items-center">
                        <Shield className="mr-2 h-4 w-4" />
                        Security
                    </TabsTrigger>
                    <TabsTrigger value="system" className="flex items-center">
                        <Database className="mr-2 h-4 w-4" />
                        System
                    </TabsTrigger>
                    <TabsTrigger value="appearance" className="flex items-center">
                        <Palette className="mr-2 h-4 w-4" />
                        Appearance
                    </TabsTrigger>
                    <TabsTrigger value="general" className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        General
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="profile">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Profile Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center space-x-4">
                                    <Avatar className="h-20 w-20">
                                        <AvatarImage src="/api/placeholder/80/80" />
                                        <AvatarFallback>AD</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <Button variant="outline">Change Photo</Button>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            JPG, PNG up to 2MB
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName">First Name</Label>
                                        <Input id="firstName" defaultValue="John" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName">Last Name</Label>
                                        <Input id="lastName" defaultValue="Admin" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" type="email" defaultValue="admin@hospital.com" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone</Label>
                                        <Input id="phone" defaultValue="+1 (555) 123-4567" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="department">Department</Label>
                                        <Select defaultValue="administration">
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="administration">Administration</SelectItem>
                                                <SelectItem value="cardiology">Cardiology</SelectItem>
                                                <SelectItem value="neurology">Neurology</SelectItem>
                                                <SelectItem value="emergency">Emergency</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="role">Role</Label>
                                        <Select defaultValue="admin">
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="admin">Administrator</SelectItem>
                                                <SelectItem value="doctor">Doctor</SelectItem>
                                                <SelectItem value="nurse">Nurse</SelectItem>
                                                <SelectItem value="receptionist">Receptionist</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="bio">Bio</Label>
                                    <Textarea
                                        id="bio"
                                        placeholder="Tell us about yourself..."
                                        defaultValue="Hospital administrator with 10+ years of experience in healthcare management."
                                    />
                                </div>

                                <Button>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Changes
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="notifications">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Notification Preferences</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div>
                                    <h4 className="mb-4">Communication</h4>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <Label>Email notifications</Label>
                                                <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                                            </div>
                                            <Switch
                                                checked={notifications.email}
                                                onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <Label>SMS notifications</Label>
                                                <p className="text-sm text-muted-foreground">Receive notifications via SMS</p>
                                            </div>
                                            <Switch
                                                checked={notifications.sms}
                                                onCheckedChange={(checked) => setNotifications({ ...notifications, sms: checked })}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <Label>Push notifications</Label>
                                                <p className="text-sm text-muted-foreground">Receive browser push notifications</p>
                                            </div>
                                            <Switch
                                                checked={notifications.push}
                                                onCheckedChange={(checked) => setNotifications({ ...notifications, push: checked })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                <div>
                                    <h4 className="mb-4">Content</h4>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <Label>Appointment reminders</Label>
                                                <p className="text-sm text-muted-foreground">Get notified about upcoming appointments</p>
                                            </div>
                                            <Switch
                                                checked={notifications.appointments}
                                                onCheckedChange={(checked) => setNotifications({ ...notifications, appointments: checked })}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <Label>Emergency alerts</Label>
                                                <p className="text-sm text-muted-foreground">Receive critical emergency notifications</p>
                                            </div>
                                            <Switch
                                                checked={notifications.emergencies}
                                                onCheckedChange={(checked) => setNotifications({ ...notifications, emergencies: checked })}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <Label>Weekly reports</Label>
                                                <p className="text-sm text-muted-foreground">Get weekly performance summaries</p>
                                            </div>
                                            <Switch
                                                checked={notifications.reports}
                                                onCheckedChange={(checked) => setNotifications({ ...notifications, reports: checked })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Button>Save Notification Settings</Button>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="security">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Password & Security</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="currentPassword">Current Password</Label>
                                        <Input id="currentPassword" type="password" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="newPassword">New Password</Label>
                                        <Input id="newPassword" type="password" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                        <Input id="confirmPassword" type="password" />
                                    </div>
                                </div>

                                <Button>Update Password</Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Two-Factor Authentication</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>Enable 2FA</Label>
                                        <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                                    </div>
                                    <Badge variant="secondary">Not Enabled</Badge>
                                </div>
                                <Button variant="outline">Set up 2FA</Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Login History</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {[
                                        { device: 'Chrome on Windows', location: 'New York, US', time: '2 hours ago', status: 'Current' },
                                        { device: 'Safari on iPhone', location: 'New York, US', time: '1 day ago', status: 'Success' },
                                        { device: 'Chrome on Windows', location: 'New York, US', time: '3 days ago', status: 'Success' }
                                    ].map((session, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div>
                                                <p className="font-medium">{session.device}</p>
                                                <p className="text-sm text-muted-foreground">{session.location} • {session.time}</p>
                                            </div>
                                            <Badge variant={session.status === 'Current' ? 'default' : 'outline'}>
                                                {session.status}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="system">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>System Configuration</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="hospitalName">Hospital Name</Label>
                                        <Input id="hospitalName" defaultValue="VINMEC" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="timezone">Timezone</Label>
                                        <Select defaultValue="vn">
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="vn">Vietnam</SelectItem>
                                                <SelectItem value="utc">UTC</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="language">Default Language</Label>
                                        <Select defaultValue="vn">
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="en">English</SelectItem>
                                                <SelectItem value="vn">Vietnamese</SelectItem>
                                                <SelectItem value="es">Spanish</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="currency">Currency</Label>
                                        <Select defaultValue="vnd">
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="usd">USD ($)</SelectItem>
                                                <SelectItem value="eur">EUR (€)</SelectItem>
                                                <SelectItem value="vnd">VND (₫)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <Separator />

                                <div>
                                    <h4 className="mb-4">Data & Privacy</h4>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <Label>Data sharing</Label>
                                                <p className="text-sm text-muted-foreground">Share anonymized data for research</p>
                                            </div>
                                            <Switch
                                                checked={privacy.dataSharing}
                                                onCheckedChange={(checked) => setPrivacy({ ...privacy, dataSharing: checked })}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <Label>Analytics</Label>
                                                <p className="text-sm text-muted-foreground">Help improve our service with usage analytics</p>
                                            </div>
                                            <Switch
                                                checked={privacy.analytics}
                                                onCheckedChange={(checked) => setPrivacy({ ...privacy, analytics: checked })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Button>Save System Settings</Button>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="appearance">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Appearance Settings</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div>
                                    <Label className="mb-3 block">Theme</Label>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="border rounded-lg p-4 cursor-pointer hover:border-primary">
                                            <div className="w-full h-20 bg-white border rounded mb-2"></div>
                                            <p className="text-sm text-center">Light</p>
                                        </div>
                                        <div className="border rounded-lg p-4 cursor-pointer hover:border-primary">
                                            <div className="w-full h-20 bg-gray-900 border rounded mb-2"></div>
                                            <p className="text-sm text-center">Dark</p>
                                        </div>
                                        <div className="border rounded-lg p-4 cursor-pointer hover:border-primary">
                                            <div className="w-full h-20 bg-gradient-to-br from-white to-gray-900 border rounded mb-2"></div>
                                            <p className="text-sm text-center">System</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <Label className="mb-3 block">Accent Color</Label>
                                    <div className="flex space-x-2">
                                        {['blue', 'green', 'purple', 'red', 'orange'].map((color) => (
                                            <div
                                                key={color}
                                                className={`w-8 h-8 rounded-full cursor-pointer border-2 border-gray-200 bg-${color}-500`}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="density">Interface Density</Label>
                                    <Select defaultValue="comfortable">
                                        <SelectTrigger className="mt-2">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="compact">Compact</SelectItem>
                                            <SelectItem value="comfortable">Comfortable</SelectItem>
                                            <SelectItem value="spacious">Spacious</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Button>Save Appearance Settings</Button>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="general">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>General Settings</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="hospitalAddress">Hospital Address</Label>
                                        <Textarea
                                            id="hospitalAddress"
                                            defaultValue="Lô đất ký hiệu F2-CCTP3, KĐT mới Tây Mỗ - Đại Mỗ - Vinhomes Park, Đường Tây Mỗ, Phường Tây Mỗ, thành phố Hà Nội"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="contactPhone">Contact Phone</Label>
                                        <Input id="contactPhone" defaultValue="02432085678" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="emergencyPhone">Emergency Phone</Label>
                                        <Input id="emergencyPhone" defaultValue="02432085678 - 114" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="website">Website</Label>
                                        <Input id="website" defaultValue="https://www.vinmec.com" />
                                    </div>
                                </div>

                                <Separator />

                                <div>
                                    <h4 className="mb-4">Business Hours</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Weekdays</Label>
                                            <div className="flex space-x-2">
                                                <Input defaultValue="8:00 AM" />
                                                <span className="self-center">to</span>
                                                <Input defaultValue="8:00 PM" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Weekends</Label>
                                            <div className="flex space-x-2">
                                                <Input defaultValue="9:00 AM" />
                                                <span className="self-center">to</span>
                                                <Input defaultValue="6:00 PM" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Button>Save General Settings</Button>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}