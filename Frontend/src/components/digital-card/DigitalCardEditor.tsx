import { useState, useEffect } from 'react';
import { Surface } from '@/components/Surface';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  User,
  Briefcase,
  Building2,
  Phone,
  MapPin,
  Globe,
  Linkedin,
  Twitter,
  Instagram,
  Tag,
  Save,
  Loader2,
  X,
  Plus,
} from 'lucide-react';
import type { DigitalCardData } from './DigitalCardPreview';
import { useUpdateProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';

interface DigitalCardEditorProps {
  initialData: DigitalCardData;
  onDataChange: (data: DigitalCardData) => void;
  onCancel?: () => void;
  onSaved?: () => void;
}

export const DigitalCardEditor = ({
  initialData,
  onDataChange,
  onCancel,
  onSaved,
}: DigitalCardEditorProps) => {
  const [formData, setFormData] = useState<DigitalCardData>({ ...initialData });
  const [newSkill, setNewSkill] = useState('');
  const updateProfileMutation = useUpdateProfile();

  useEffect(() => {
    setFormData({ ...initialData });
  }, [initialData]);

  const handleChange = (field: keyof DigitalCardData, value: string) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onDataChange(updated);
  };

  const handleAddSkill = () => {
    const trimmed = newSkill.trim();
    if (!trimmed) return;
    const current = formData.skills || [];
    if (current.includes(trimmed)) {
      toast.info('Tag already exists');
      return;
    }
    const updatedSkills = [...current, trimmed];
    const updated = { ...formData, skills: updatedSkills };
    setFormData(updated);
    onDataChange(updated);
    setNewSkill('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    const updatedSkills = (formData.skills || []).filter((s) => s !== skillToRemove);
    const updated = { ...formData, skills: updatedSkills };
    setFormData(updated);
    onDataChange(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfileMutation.mutateAsync({
        firstName: formData.firstName.trim() || undefined,
        lastName: formData.lastName.trim() || undefined,
        position: formData.position?.trim() || undefined,
        company: formData.company?.trim() || undefined,
        location: formData.location?.trim() || undefined,
        phone: formData.phone?.trim() || undefined,
        website: formData.website?.trim() || undefined,
        linkedin: formData.linkedin?.trim() || undefined,
        twitter: formData.twitter?.trim() || undefined,
        instagram: formData.instagram?.trim() || undefined,
        avatar: formData.avatar?.trim() || undefined,
        skills: formData.skills,
      });

      toast.success('Digital business card updated successfully!');
      if (onSaved) onSaved();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update digital card. Please try again.');
    }
  };

  return (
    <Surface className="p-4 sm:p-6 border border-border shadow-sm rounded-2xl bg-card space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-foreground">
            Customize Digital Card
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Edit your card details. Changes update in real-time.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* ── 1. Identity & Designation ── */}
        <div className="space-y-3.5">
          <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-primary" /> Name & Title
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <span className="text-[11px] text-muted-foreground font-medium">First name *</span>
              <Input
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                placeholder="First name"
                className="h-10 px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-card border-border/80 focus:border-primary shadow-xs"
                required
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-[11px] text-muted-foreground font-medium">Last name</span>
              <Input
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                placeholder="Last name"
                className="h-10 px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-card border-border/80 focus:border-primary shadow-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <span className="text-[11px] text-muted-foreground font-medium">Job Designation</span>
              <Input
                value={formData.position || ''}
                onChange={(e) => handleChange('position', e.target.value)}
                placeholder="e.g. Founder"
                className="h-10 px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-card border-border/80 focus:border-primary shadow-xs"
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-[11px] text-muted-foreground font-medium">Company Name</span>
              <Input
                value={formData.company || ''}
                onChange={(e) => handleChange('company', e.target.value)}
                placeholder="e.g. WiseIN"
                className="h-10 px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-card border-border/80 focus:border-primary shadow-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] text-muted-foreground font-medium">Profile Image URL</span>
            <Input
              value={formData.avatar || ''}
              onChange={(e) => handleChange('avatar', e.target.value)}
              placeholder="https://example.com/photo.jpg"
              className="h-10 px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-card border-border/80 focus:border-primary shadow-xs"
            />
          </div>
        </div>

        {/* ── 2. Pill Tags / Skills ── */}
        <div className="space-y-2.5 pt-1">
          <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-primary" /> Pill Tags (e.g. Entrepreneur, AI/ML)
          </Label>
          <div className="flex gap-2">
            <Input
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSkill();
                }
              }}
              placeholder="Add a tag..."
              className="h-10 px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-card border-border/80 focus:border-primary shadow-xs"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddSkill}
              className="h-10 px-4 text-xs font-medium rounded-xl border-border/80"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Add
            </Button>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {(formData.skills || ['Entrepreneur', 'AI/ML', 'Networking']).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-muted border border-border"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(tag)}
                  className="hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* ── 3. Contact & Location ── */}
        <div className="space-y-3.5 pt-1">
          <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-primary" /> Contact Details
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <span className="text-[11px] text-muted-foreground font-medium">Location</span>
              <Input
                value={formData.location || ''}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="e.g. Hyderabad, India"
                className="h-10 px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-card border-border/80 focus:border-primary shadow-xs"
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-[11px] text-muted-foreground font-medium">Phone number</span>
              <Input
                value={formData.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+91 98765 43210"
                className="h-10 px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-card border-border/80 focus:border-primary shadow-xs"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <span className="text-[11px] text-muted-foreground font-medium">Website</span>
            <Input
              value={formData.website || ''}
              onChange={(e) => handleChange('website', e.target.value)}
              placeholder="https://yoursite.com"
              className="h-10 px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-card border-border/80 focus:border-primary shadow-xs"
            />
          </div>
        </div>

        {/* ── 4. Social Links ── */}
        <div className="space-y-3.5 pt-1">
          <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-primary" /> Social Networks
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <span className="text-[11px] text-muted-foreground font-medium">LinkedIn</span>
              <Input
                value={formData.linkedin || ''}
                onChange={(e) => handleChange('linkedin', e.target.value)}
                placeholder="LinkedIn URL"
                className="h-10 px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-card border-border/80 focus:border-primary shadow-xs"
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-[11px] text-muted-foreground font-medium">Twitter / X</span>
              <Input
                value={formData.twitter || ''}
                onChange={(e) => handleChange('twitter', e.target.value)}
                placeholder="Twitter / X URL"
                className="h-10 px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-card border-border/80 focus:border-primary shadow-xs"
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-[11px] text-muted-foreground font-medium">Instagram</span>
              <Input
                value={formData.instagram || ''}
                onChange={(e) => handleChange('instagram', e.target.value)}
                placeholder="Instagram URL"
                className="h-10 px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-card border-border/80 focus:border-primary shadow-xs"
              />
            </div>
          </div>
        </div>

        {/* ── Action Buttons ── */}
        <div className="flex items-center gap-2.5 pt-4 border-t border-border">
          <Button
            type="submit"
            disabled={updateProfileMutation.isPending}
            className="flex-1 rounded-xl h-10 font-semibold text-xs sm:text-sm bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
          >
            {updateProfileMutation.isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Saving changes...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="w-4 h-4" /> Save Changes
              </span>
            )}
          </Button>

          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="rounded-xl h-10 text-xs px-4"
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Surface>
  );
};
