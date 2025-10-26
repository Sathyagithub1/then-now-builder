import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";

interface WorkCropType {
  id: string;
  name: string;
  description: string | null;
}

interface WorkType {
  id: string;
  name: string;
  description: string | null;
  work_crop_type_id: string;
}

interface UserWorkType {
  work_type_id: string;
  work_crop_type_id: string;
}

export default function MyWorkTypes() {
  const navigate = useNavigate();
  const [workCropTypes, setWorkCropTypes] = useState<WorkCropType[]>([]);
  const [workTypes, setWorkTypes] = useState<WorkType[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    setUserId(user.id);

    // Load work crop types and work types
    const [cropTypesRes, workTypesRes, userTypesRes] = await Promise.all([
      supabase.from("work_crop_types").select("*").eq("is_active", true).order("name"),
      supabase.from("work_types").select("*").eq("is_active", true).order("name"),
      supabase.from("user_work_types").select("work_type_id").eq("user_id", user.id)
    ]);

    if (cropTypesRes.data) setWorkCropTypes(cropTypesRes.data);
    if (workTypesRes.data) setWorkTypes(workTypesRes.data);
    
    if (userTypesRes.data) {
      setSelectedTypes(new Set(userTypesRes.data.map(t => t.work_type_id)));
    }

    setLoading(false);
  };

  const toggleWorkType = (workTypeId: string, workCropTypeId: string) => {
    const newSelected = new Set(selectedTypes);
    if (newSelected.has(workTypeId)) {
      newSelected.delete(workTypeId);
    } else {
      newSelected.add(workTypeId);
    }
    setSelectedTypes(newSelected);
  };

  const handleSave = async () => {
    if (!userId) return;

    setSaving(true);

    try {
      // Delete all existing user work types
      await supabase.from("user_work_types").delete().eq("user_id", userId);

      // Insert selected work types
      if (selectedTypes.size > 0) {
        const insertData = Array.from(selectedTypes).map(workTypeId => {
          const workType = workTypes.find(t => t.id === workTypeId);
          return {
            user_id: userId,
            work_type_id: workTypeId,
            work_crop_type_id: workType!.work_crop_type_id
          };
        });

        const { error } = await supabase.from("user_work_types").insert(insertData);

        if (error) throw error;
      }

      toast.success("Work types updated successfully");
      navigate("/profile");
    } catch (error: any) {
      toast.error("Failed to save work types");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-4xl font-bold">My Work Types</h1>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Your Skills</CardTitle>
            <CardDescription>
              Choose the types of work you can do. This helps farmers find you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary">
                {selectedTypes.size} work type{selectedTypes.size !== 1 ? 's' : ''} selected
              </Badge>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {workCropTypes.map((cropType) => {
            const relatedTypes = workTypes.filter(t => t.work_crop_type_id === cropType.id);
            if (relatedTypes.length === 0) return null;

            return (
              <Card key={cropType.id}>
                <CardHeader>
                  <CardTitle>{cropType.name}</CardTitle>
                  {cropType.description && (
                    <CardDescription>{cropType.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-3">
                    {relatedTypes.map((workType) => (
                      <div key={workType.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={workType.id}
                          checked={selectedTypes.has(workType.id)}
                          onCheckedChange={() => toggleWorkType(workType.id, cropType.id)}
                        />
                        <Label htmlFor={workType.id} className="cursor-pointer flex-1">
                          {workType.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="sticky bottom-4 mt-6">
          <Button onClick={handleSave} disabled={saving} size="lg" className="w-full">
            <Save className="mr-2 h-5 w-5" />
            {saving ? "Saving..." : "Save Work Types"}
          </Button>
        </div>
      </div>
    </div>
  );
}
