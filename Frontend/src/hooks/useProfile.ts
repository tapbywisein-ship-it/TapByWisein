import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService, UpdateProfilePayload } from '@/services/profile.service';
import { useAppStore } from '@/store/appStore';
import { toast } from 'sonner';

export const profileKeys = {
  mine: () => ['profile', 'mine'] as const,
  public: (userId: string) => ['profile', 'public', userId] as const,
};

export function useMyProfile() {
  const updateUser = useAppStore((s) => s.updateUser);
  return useQuery({
    queryKey: profileKeys.mine(),
    queryFn: async () => {
      const res = await profileService.getMyProfile();
      if (res.data?.profile) {
        const p = res.data.profile;
        updateUser({
          avatar: p.avatar ?? undefined,
          bio: p.bio ?? undefined,
          designation: p.position ?? undefined,
          company: p.company ?? undefined,
          skills: p.skills ?? [],
          interests: p.interests ?? [],
          lookingFor: p.lookingFor ?? [],
          linkedin: p.linkedin ?? undefined,
          twitter: p.twitter ?? undefined,
          website: p.website ?? undefined,
        });
      }
      return res;
    },
    select: (res) => res.data,
  });
}

export function usePublicProfile(userId: string) {
  return useQuery({
    queryKey: profileKeys.public(userId),
    queryFn: () => profileService.getPublicProfile(userId),
    select: (res) => res.data,
    enabled: !!userId,
  });
}

export function useUpdateProfile({ silent = false }: { silent?: boolean } = {}) {
  const qc = useQueryClient();
  const updateUser = useAppStore((s) => s.updateUser);
  return useMutation({
    mutationFn: async (payload: UpdateProfilePayload) => {
      const res = await profileService.updateProfile(payload);
      if (res.data) {
        const p = res.data;
        updateUser({
          avatar: p.avatar ?? undefined,
          bio: p.bio ?? undefined,
          designation: p.position ?? undefined,
          company: p.company ?? undefined,
          skills: p.skills ?? undefined,
          interests: p.interests ?? undefined,
          lookingFor: p.lookingFor ?? undefined,
          linkedin: p.linkedin ?? undefined,
          twitter: p.twitter ?? undefined,
          website: p.website ?? undefined,
        });
      }
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: profileKeys.mine() });
      if (!silent) toast.success('Profile updated!');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
