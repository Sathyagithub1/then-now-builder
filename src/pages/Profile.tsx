import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Star } from "lucide-react";
import { ReviewList } from "@/components/reviews/ReviewList";
import type { NavigateFunction } from "react-router-dom";

interface ProfileFormProps {
  profile: any;
  setProfile: (value: any) => void;
  sensitiveData: any;
  setSensitiveData: (value: any) => void;
  saving: boolean;
  handleSave: () => void;
  navigate: NavigateFunction;
}

interface ProfileFieldsProps {
  profile: any;
  setProfile: (value: any) => void;
}

interface SensitiveFieldsProps {
  sensitiveData: any;
  setSensitiveData: (value: any) => void;
}

function ProfileAvatarSection({ profile, setProfile }: ProfileFieldsProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <Avatar className="h-24 w-24">
        <AvatarImage src={profile?.avatar_url} />
        <AvatarFallback>
          {profile?.full_name?.split(" ").map((n: string) => n[0]).join("")}
        </AvatarFallback>
      </Avatar>
      <div className="w-full space-y-2">
        <Label htmlFor="avatar_url">Avatar URL</Label>
        <Input
          id="avatar_url"
          value={profile?.avatar_url || ""}
          onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })}
          placeholder="https://example.com/avatar.jpg"
        />
      </div>
    </div>
  );
}

function ProfileContactFields({
  profile,
  setProfile,
  sensitiveData,
  setSensitiveData,
}: ProfileFieldsProps & SensitiveFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="full_name">Full Name</Label>
        <Input
          id="full_name"
          value={profile?.full_name || ""}
          onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="mobile_number">Mobile Number</Label>
        <Input
          id="mobile_number"
          value={sensitiveData?.mobile_number || ""}
          onChange={(e) => setSensitiveData({ ...sensitiveData, mobile_number: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email (Optional)</Label>
        <Input
          id="email"
          type="email"
          value={sensitiveData?.email || ""}
          onChange={(e) => setSensitiveData({ ...sensitiveData, email: e.target.value })}
          placeholder="your.email@example.com"
        />
      </div>
    </>
  );
}

function ProfileLocationFields({ profile, setProfile }: ProfileFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            value={profile?.state || ""}
            onChange={(e) => setProfile({ ...profile, state: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="district">District</Label>
          <Input
            id="district"
            value={profile?.district || ""}
            onChange={(e) => setProfile({ ...profile, district: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          value={profile?.bio || ""}
          onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
          placeholder="Tell us about yourself..."
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          value={profile?.address || ""}
          onChange={(e) => setProfile({ ...profile, address: e.target.value })}
          placeholder="Your full address..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="coordinates_lat">Latitude (Optional)</Label>
          <Input
            id="coordinates_lat"
            type="number"
            step="0.000001"
            value={profile?.coordinates_lat || ""}
            onChange={(e) => setProfile({ ...profile, coordinates_lat: parseFloat(e.target.value) || null })}
            placeholder="13.0827"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="coordinates_lng">Longitude (Optional)</Label>
          <Input
            id="coordinates_lng"
            type="number"
            step="0.000001"
            value={profile?.coordinates_lng || ""}
            onChange={(e) => setProfile({ ...profile, coordinates_lng: parseFloat(e.target.value) || null })}
            placeholder="80.2707"
          />
        </div>
      </div>
    </>
  );
}

function ProfileLanguageAndRole({
  profile,
  setProfile,
  navigate,
}: ProfileFieldsProps & { navigate: NavigateFunction }) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="preferred_language">Preferred Language</Label>
        <select
          id="preferred_language"
          className="w-full p-2 border rounded"
          value={profile?.preferred_language || "en"}
          onChange={(e) => setProfile({ ...profile, preferred_language: e.target.value })}
        >
          <option value="en">English</option>
          <option value="hi">Hindi</option>
          <option value="ta">Tamil</option>
          <option value="te">Telugu</option>
          <option value="kn">Kannada</option>
          <option value="ml">Malayalam</option>
          <option value="bn">Bengali</option>
          <option value="mr">Marathi</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label>Role</Label>
        <Input value={profile?.role || ""} disabled />
      </div>

      {profile?.role === "farm_worker" && (
        <div>
          <Button onClick={() => navigate("/my-work-types")} variant="outline" className="w-full">
            Manage My Work Types & Skills
          </Button>
        </div>
      )}
    </>
  );
}

function ProfileRatingDisplay({ profile }: { profile: any }) {
  if (!(profile?.average_rating > 0)) return null;
  return (
    <div className="space-y-2">
      <Label>Your Rating</Label>
      <div className="flex items-center gap-2">
        <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
        <span className="text-xl font-semibold">
          {profile.average_rating.toFixed(1)}
        </span>
        <span className="text-muted-foreground">
          ({profile.total_ratings} review{profile.total_ratings !== 1 ? 's' : ''})
        </span>
      </div>
    </div>
  );
}

function ProfileForm({
  profile,
  setProfile,
  sensitiveData,
  setSensitiveData,
  saving,
  handleSave,
  navigate,
}: ProfileFormProps) {
  return (
    <CardContent className="space-y-6">
      <ProfileAvatarSection profile={profile} setProfile={setProfile} />

      <ProfileContactFields
        profile={profile}
        setProfile={setProfile}
        sensitiveData={sensitiveData}
        setSensitiveData={setSensitiveData}
      />

      <ProfileLocationFields profile={profile} setProfile={setProfile} />

      <ProfileLanguageAndRole
        profile={profile}
        setProfile={setProfile}
        navigate={navigate}
      />

      <ProfileRatingDisplay profile={profile} />

      <Button onClick={handleSave} disabled={saving} className="w-full">
        <Save className="h-4 w-4 mr-2" />
        {saving ? "Saving..." : "Save Changes"}
      </Button>
    </CardContent>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [sensitiveData, setSensitiveData] = useState<any>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const [profileResult, sensitiveResult] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", session.user.id).single(),
        supabase.from("profile_sensitive_data").select("*").eq("id", session.user.id).single(),
      ]);

      if (profileResult.error) throw profileResult.error;
      setProfile(profileResult.data);
      setSensitiveData(sensitiveResult.data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const [profileUpdate, sensitiveUpdate] = await Promise.all([
        supabase.from("profiles").update({
          full_name: profile.full_name,
          state: profile.state,
          district: profile.district,
          bio: profile.bio,
          avatar_url: profile.avatar_url,
          address: profile.address,
          coordinates_lat: profile.coordinates_lat,
          coordinates_lng: profile.coordinates_lng,
          preferred_language: profile.preferred_language,
        }).eq("id", session.user.id),
        supabase.from("profile_sensitive_data").update({
          mobile_number: sensitiveData?.mobile_number,
          email: sensitiveData?.email,
        }).eq("id", session.user.id),
      ]);

      if (profileUpdate.error) throw profileUpdate.error;
      if (sensitiveUpdate.error) throw sensitiveUpdate.error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">My Profile</h1>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <ProfileForm
            profile={profile}
            setProfile={setProfile}
            sensitiveData={sensitiveData}
            setSensitiveData={setSensitiveData}
            saving={saving}
            handleSave={handleSave}
            navigate={navigate}
          />
        </Card>

        {profile && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ReviewList userId={profile.id} />
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}