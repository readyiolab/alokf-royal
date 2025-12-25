// pages/admin/UserManagement.jsx
// Admin page for managing cashiers and floor managers

import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Search,
  Edit,
  Key,
  UserCheck,
  UserX,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  Shield,
  LayoutGrid
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

import AdminLayout from "../../components/layouts/AdminLayout";
import userService from "../../services/user.service";

const UserManagement = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");

  // Create User Modal
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    full_name: "",
    phone_number: "",
    email: "",
    role: "cashier"
  });
  const [creating, setCreating] = useState(false);

  // Credentials Modal (shown after creating user)
  const [credentialsDialogOpen, setCredentialsDialogOpen] = useState(false);
  const [newCredentials, setNewCredentials] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // Edit User Modal
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Reset Password Modal
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetUser, setResetUser] = useState(null);
  const [newPassword, setNewPassword] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await userService.getAllUsers();
      setUsers(response.data || []);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch users"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!createForm.full_name || !createForm.role) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields"
      });
      return;
    }

    setCreating(true);
    try {
      const response = await userService.createUser(createForm);
      setNewCredentials(response.data);
      setCreateDialogOpen(false);
      setCredentialsDialogOpen(true);
      setCreateForm({
        full_name: "",
        phone_number: "",
        email: "",
        role: "cashier"
      });
      fetchUsers();
      toast({
        title: "Success",
        description: response.message
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.message || "Failed to create user"
      });
    } finally {
      setCreating(false);
    }
  };

  const handleEditUser = async () => {
    try {
      await userService.updateUser(editingUser.user_id, editForm);
      setEditDialogOpen(false);
      fetchUsers();
      toast({
        title: "Success",
        description: "User updated successfully"
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.message || "Failed to update user"
      });
    }
  };

  const handleResetPassword = async () => {
    try {
      const response = await userService.resetPassword(resetUser.user_id);
      setNewPassword(response.data.new_password);
      fetchUsers();
      toast({
        title: "Success",
        description: "Password reset successfully"
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.message || "Failed to reset password"
      });
    }
  };

  const handleToggleActive = async (user) => {
    try {
      if (user.is_active) {
        await userService.deactivateUser(user.user_id);
        toast({
          title: "Success",
          description: "User deactivated"
        });
      } else {
        await userService.activateUser(user.user_id);
        toast({
          title: "Success",
          description: "User activated"
        });
      }
      fetchUsers();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.message || "Failed to update user status"
      });
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Copied to clipboard"
    });
  };

  const openEditDialog = (user) => {
    setEditingUser(user);
    setEditForm({
      full_name: user.full_name,
      phone_number: user.phone_number || "",
      email: user.email || "",
      is_2fa_enabled: user.is_2fa_enabled
    });
    setEditDialogOpen(true);
  };

  const openResetDialog = (user) => {
    setResetUser(user);
    setNewPassword(null);
    setResetDialogOpen(true);
  };

  const getRoleIcon = (role) => {
    if (role === "cashier") return <Shield className="w-4 h-4" />;
    if (role === "floor_manager") return <LayoutGrid className="w-4 h-4" />;
    return <Users className="w-4 h-4" />;
  };

  const getRoleBadge = (role) => {
    if (role === "cashier") {
      return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Cashier</Badge>;
    }
    if (role === "floor_manager") {
      return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Floor Manager</Badge>;
    }
    return <Badge variant="secondary">{role}</Badge>;
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.username?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === "all" || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const cashierCount = users.filter(u => u.role === "cashier").length;
  const floorManagerCount = users.filter(u => u.role === "floor_manager").length;
  const activeCount = users.filter(u => u.is_active).length;

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600">Manage cashiers and floor managers</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add User
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="bg-white text-black">
            <CardContent className="p-4">
              <div className="flex items-center justify-between ">
                <div>
                  <p className="text-sm text-black">Total Users</p>
                  <p className="text-2xl font-bold">{users.length}</p>
                </div>
                <Users className="w-8 h-8 text-black" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white text-black">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-black">Cashiers</p>
                  <p className="text-2xl font-bold text-black">{cashierCount}</p>
                </div>
                <Shield className="w-8 h-8 text-black" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white text-black">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-black">Floor Managers</p>
                  <p className="text-2xl font-bold text-black">{floorManagerCount}</p>
                </div>
                <LayoutGrid className="w-8 h-8 text-black" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white text-black">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-black">Active</p>
                  <p className="text-2xl font-bold text-black">{activeCount}</p>
                </div>
                <UserCheck className="w-8 h-8 text-black" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black w-4 h-4" />
            <Input
              placeholder="Search by name or username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white text-black"
            />
          </div>
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="w-48 bg-white text-black">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="cashier">Cashier</SelectItem>
              <SelectItem value="floor_manager">Floor Manager</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchUsers} className="bg-white text-black">
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </div>

        {/* Users Table */}
        <Card className="bg-white text-black"   >
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No users found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">{user.full_name}</p>
                          <p className="text-sm text-gray-500">{user.username}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{user.phone_number || "—"}</p>
                          <p className="text-gray-500">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.is_active ? (
                          <Badge className="bg-green-100 text-green-700">Active</Badge>
                        ) : (
                          <Badge variant="destructive">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString("en-IN")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(user)}
                            className="bg-white text-black"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-white text-black"
                            onClick={() => openResetDialog(user)}
                          >
                            <Key className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={user.is_active ? "destructive" : "default"}
                            onClick={() => handleToggleActive(user)}
                          >
                            {user.is_active ? (
                              <UserX className="w-4 h-4" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create User Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Add a new cashier or floor manager. Username and password will be auto-generated.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input
                  value={createForm.full_name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Enter full name"
                />
              </div>
              <div className="space-y-2">
                <Label>Role *</Label>
                <Select
                  value={createForm.role}
                  onValueChange={(v) => setCreateForm(prev => ({ ...prev, role: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cashier">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4" /> Cashier
                      </div>
                    </SelectItem>
                    <SelectItem value="floor_manager">
                      <div className="flex items-center gap-2">
                        <LayoutGrid className="w-4 h-4" /> Floor Manager
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  value={createForm.phone_number}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, phone_number: e.target.value }))}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="space-y-2">
                <Label>Email (Optional)</Label>
                <Input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateUser} disabled={creating}>
                {creating ? "Creating..." : "Create User"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Credentials Dialog (shown after creating) */}
        <Dialog open={credentialsDialogOpen} onOpenChange={setCredentialsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <UserCheck className="w-5 h-5" /> User Created Successfully
              </DialogTitle>
              <DialogDescription>
                Share these credentials securely with the user. The password won't be shown again.
              </DialogDescription>
            </DialogHeader>
            {newCredentials && (
              <div className="space-y-4 py-4">
                <Alert className="bg-yellow-50 border-yellow-200">
                  <AlertDescription className="text-yellow-800">
                     Save these credentials! The password will not be shown again.
                  </AlertDescription>
                </Alert>
                <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Username</p>
                      <p className="font-mono font-semibold text-black">{newCredentials.username}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(newCredentials.username)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Password</p>
                      <p className="font-mono font-semibold text-black">
                        {showPassword ? newCredentials.password : "••••••••"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(newCredentials.password)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Role</p>
                    <p className="font-semibold capitalize text-black">{newCredentials.role?.replace("_", " ")}</p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setCredentialsDialogOpen(false)}>
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user details for {editingUser?.full_name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={editForm.full_name || ""}
                  onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  value={editForm.phone_number || ""}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phone_number: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editForm.email || ""}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditUser}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reset Password Dialog */}
        <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Reset Password</DialogTitle>
              <DialogDescription>
                Reset password for {resetUser?.full_name} ({resetUser?.username})
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {newPassword ? (
                <div className="space-y-4">
                  <Alert className="bg-green-50 border-green-200">
                    <AlertDescription className="text-green-800">
                      Password reset successfully!
                    </AlertDescription>
                  </Alert>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">New Password</p>
                        <p className="font-mono font-semibold">
                          {showPassword ? newPassword : "••••••••"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(newPassword)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <Alert>
                  <AlertDescription>
                    This will generate a new random password. The user will need the new password to log in.
                  </AlertDescription>
                </Alert>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setResetDialogOpen(false)}>
                {newPassword ? "Done" : "Cancel"}
              </Button>
              {!newPassword && (
                <Button onClick={handleResetPassword}>
                  Reset Password
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default UserManagement;

