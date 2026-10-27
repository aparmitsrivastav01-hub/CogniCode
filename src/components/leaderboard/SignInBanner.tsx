import { useState } from 'react';
import { Check, Edit2, User, UserCheck } from 'lucide-react';
import { Card } from '../page/Card';

export interface SignInBannerProps {
  userHandle: string;
  onSaveHandle: (newHandle: string) => void;
  className?: string;
}

export function SignInBanner({
  userHandle,
  onSaveHandle,
  className = '',
}: SignInBannerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputVal, setInputVal] = useState(userHandle);

  const handleSave = (e?: React.FormEvent) => {
    e?.preventDefault();
    const clean = inputVal.trim();
    if (clean) {
      onSaveHandle(clean);
      setIsEditing(false);
    }
  };

  if (userHandle && !isEditing) {
    return (
      <Card className={`leaderboard-banner signed-in ${className}`}>
        <div className="banner-left">
          <div className="banner-icon-box success">
            <UserCheck size={18} />
          </div>
          <div className="banner-text">
            <span className="banner-title">Participating as {userHandle}</span>
            <span className="banner-subtitle">
              Your verified round completions and comprehension diagnostics are tracked under this handle.
            </span>
          </div>
        </div>
        <button
          type="button"
          className="banner-action-btn secondary inline-flex items-center gap-1.5"
          onClick={() => {
            setInputVal(userHandle);
            setIsEditing(true);
          }}
        >
          <Edit2 size={13} />
          <span>Change handle</span>
        </button>
      </Card>
    );
  }

  return (
    <Card className={`leaderboard-banner ${className}`}>
      <div className="banner-left">
        <div className="banner-icon-box">
          <User size={18} />
        </div>
        <div className="banner-text">
          <span className="banner-title">Set your engineer handle</span>
          <span className="banner-subtitle">
            Attribute your real round completions and verification scores on the global leaderboard.
          </span>
        </div>
      </div>

      <form onSubmit={handleSave} className="banner-handle-form">
        <input
          type="text"
          placeholder="GitHub username or handle"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          className="banner-handle-input"
          autoFocus={isEditing}
          maxLength={24}
        />
        <button
          type="submit"
          className="banner-action-btn primary inline-flex items-center gap-1.5"
          disabled={!inputVal.trim()}
        >
          <Check size={14} />
          <span>{isEditing ? 'Update' : 'Set handle'}</span>
        </button>
        {isEditing && (
          <button
            type="button"
            className="banner-action-btn secondary"
            onClick={() => setIsEditing(false)}
          >
            Cancel
          </button>
        )}
      </form>
    </Card>
  );
}
