import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";

interface WorkCropType {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
}

interface WorkType {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  work_crop_type_id: string | null;
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const { data: role, isLoading: roleLoading } = useUserRole();
  const isAdmin = role === "admin" || role === "super_admin";
  const [workCropTypes, setWorkCropTypes] = useState<WorkCropType[]>([]);
  const [workTypes, setWorkTypes] = useState<WorkType[]>([]);
  const [newCropType, setNewCropType] = useState({ name: "", description: "" });
  const [newWorkType, setNewWorkType] = useState({ name: "", description: "", work_crop_type_id: "" });

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      toast.error("Access denied. Admin privileges required.");
      navigate("/");
    }
  }, [isAdmin, roleLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const loadData = async () => {
    const [cropTypes, types] = await Promise.all([
      supabase.from("work_crop_types").select("*").order("name"),
      supabase.from("work_types").select("*").order("name")
    ]);

    if (cropTypes.data) setWorkCropTypes(cropTypes.data);
    if (types.data) setWorkTypes(types.data);
  };

  const handleAddCropType = async () => {
    if (!newCropType.name.trim()) {
      toast.error("Name is required");
      return;
    }

    const { error } = await supabase.from("work_crop_types").insert({
      name: newCropType.name,
      description: newCropType.description || null
    });

    if (error) {
      toast.error("Failed to add work category");
    } else {
      toast.success("Work category added successfully");
      setNewCropType({ name: "", description: "" });
      loadData();
    }
  };

  const handleAddWorkType = async () => {
    if (!newWorkType.name.trim() || !newWorkType.work_crop_type_id) {
      toast.error("Name and category are required");
      return;
    }

    const { error } = await supabase.from("work_types").insert({
      name: newWorkType.name,
      description: newWorkType.description || null,
      work_crop_type_id: newWorkType.work_crop_type_id
    });

    if (error) {
      toast.error("Failed to add work type");
    } else {
      toast.success("Work type added successfully");
      setNewWorkType({ name: "", description: "", work_crop_type_id: "" });
      loadData();
    }
  };

  const handleToggleCropType = async (id: string, is_active: boolean) => {
    const { error } = await supabase
      .from("work_crop_types")
      .update({ is_active })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update");
    } else {
      loadData();
    }
  };

  const handleToggleWorkType = async (id: string, is_active: boolean) => {
    const { error } = await supabase
      .from("work_types")
      .update({ is_active })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update");
    } else {
      loadData();
    }
  };

  if (roleLoading || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Admin Panel</h1>

        <Tabs defaultValue="categories">
          <TabsList>
            <TabsTrigger value="categories">Work Categories</TabsTrigger>
            <TabsTrigger value="types">Work Types</TabsTrigger>
          </TabsList>

          <TabsContent value="categories" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Add Work Category</CardTitle>
                <CardDescription>
                  Create a new work category (e.g., "Livestock", "Fruit")
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="crop-name">Category Name</Label>
                  <Input
                    id="crop-name"
                    value={newCropType.name}
                    onChange={(e) => setNewCropType({ ...newCropType, name: e.target.value })}
                    placeholder="e.g., Livestock"
                  />
                </div>
                <div>
                  <Label htmlFor="crop-desc">Description</Label>
                  <Textarea
                    id="crop-desc"
                    value={newCropType.description}
                    onChange={(e) => setNewCropType({ ...newCropType, description: e.target.value })}
                    placeholder="Brief description"
                    rows={3}
                  />
                </div>
                <Button onClick={handleAddCropType}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Category
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Existing Categories</CardTitle>
                <CardDescription>{workCropTypes.length} categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {workCropTypes.map((type) => (
                    <div key={type.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{type.name}</p>
                        {type.description && (
                          <p className="text-sm text-muted-foreground">{type.description}</p>
                        )}
                      </div>
                      <Switch
                        checked={type.is_active}
                        onCheckedChange={(checked) => handleToggleCropType(type.id, checked)}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="types" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Add Work Type</CardTitle>
                <CardDescription>
                  Create a specific work type under a category
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="type-category">Category</Label>
                  <select
                    id="type-category"
                    className="w-full p-2 border rounded"
                    value={newWorkType.work_crop_type_id}
                    onChange={(e) => setNewWorkType({ ...newWorkType, work_crop_type_id: e.target.value })}
                  >
                    <option value="">Select a category</option>
                    {workCropTypes.filter(t => t.is_active).map((type) => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="type-name">Work Type Name</Label>
                  <Input
                    id="type-name"
                    value={newWorkType.name}
                    onChange={(e) => setNewWorkType({ ...newWorkType, name: e.target.value })}
                    placeholder="e.g., Cattle Farmer"
                  />
                </div>
                <div>
                  <Label htmlFor="type-desc">Description</Label>
                  <Textarea
                    id="type-desc"
                    value={newWorkType.description}
                    onChange={(e) => setNewWorkType({ ...newWorkType, description: e.target.value })}
                    placeholder="Brief description"
                    rows={3}
                  />
                </div>
                <Button onClick={handleAddWorkType}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Work Type
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Existing Work Types</CardTitle>
                <CardDescription>{workTypes.length} work types</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {workTypes.map((type) => (
                    <div key={type.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{type.name}</p>
                        {type.description && (
                          <p className="text-sm text-muted-foreground">{type.description}</p>
                        )}
                      </div>
                      <Switch
                        checked={type.is_active}
                        onCheckedChange={(checked) => handleToggleWorkType(type.id, checked)}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
