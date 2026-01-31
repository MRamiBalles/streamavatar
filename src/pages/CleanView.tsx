import { AvatarRenderer } from '@/components/avatars/AvatarRenderer';

const CleanView = () => {
  return (
    <div className="w-screen h-screen overflow-hidden">
      <AvatarRenderer isCleanView />
    </div>
  );
};

export default CleanView;
