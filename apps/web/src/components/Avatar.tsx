'use client';

import clsx from 'clsx';
import type { UserPublic } from '@studyzone/shared-types';
import { avatarColor, avatarInitial } from '@studyzone/shared-logic';

type AvatarUser = Pick<UserPublic, 'id' | 'nickname' | 'avatarUrl'>;

export function Avatar({
  user,
  size = 40,
  onClick,
  className,
}: {
  user: AvatarUser;
  size?: number;
  onClick?: () => void;
  className?: string;
}) {
  const interactive = !!onClick;
  const commonStyle = { width: size, height: size };

  const content = user.avatarUrl ? (
    <img
      src={user.avatarUrl}
      alt=""
      draggable={false}
      className="h-full w-full rounded-full bg-sz-mist object-cover"
    />
  ) : (
    <span
      className="flex h-full w-full items-center justify-center rounded-full font-display font-heavy text-white"
      style={{ backgroundColor: avatarColor(user.id), fontSize: size * 0.5 }}
    >
      {avatarInitial(user.nickname)}
    </span>
  );

  const base = clsx('block shrink-0 overflow-hidden rounded-full', className);

  if (interactive) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={`查看 ${user.nickname} 的资料`}
        className={clsx(
          base,
          'transition-transform duration-100 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-sz-sky',
        )}
        style={commonStyle}
      >
        {content}
      </button>
    );
  }

  return (
    <span className={base} style={commonStyle}>
      {content}
    </span>
  );
}
