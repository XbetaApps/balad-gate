# Session Verification Components

This directory contains components and hooks for handling session verification in your application.

## Components

### SessionVerification

A wrapper component that verifies the user's session before allowing an action to be performed.

#### Props

- `onVerified`: Function to call when the user is verified (logged in)
- `onCancel`: (Optional) Function to call when the user cancels the action
- `actionName`: (Optional) The name of the action being performed (for display in the login prompt)

#### Example Usage

```jsx
import SessionVerification from '@/components/session/SessionVerification';

function LikeButton({ postId }) {
  const handleLike = () => {
    // Your like logic here
    console.log('Liking post:', postId);
  };

  return (
    <SessionVerification 
      onVerified={handleLike}
      actionName="الإعجاب بهذا المنشور"
    >
      <button className="like-button">
        <span>🤍</span> أعجبني
      </button>
    </SessionVerification>
  );
}
```

## Hooks

### useSessionAction

A custom hook that provides a way to execute actions that require authentication.

#### Parameters

- `action`: The function to execute when the user is authenticated
- `actionName`: (Optional) The name of the action (for display in the login prompt)

#### Returns

- `executeAction`: A function that will execute the action if the user is authenticated, or show a login prompt
- `LoginPrompt`: A component that renders the login prompt (should be included in your component's JSX)

#### Example Usage

```jsx
import { useState } from 'react';
import useSessionAction from '@/hooks/useSessionAction';

function CommentForm({ postId }) {
  const [comment, setComment] = useState('');
  
  const submitComment = async () => {
    // Your comment submission logic here
    console.log('Posting comment:', { postId, comment });
    setComment('');
  };

  const { executeAction, LoginPrompt } = useSessionAction(
    submitComment,
    'نشر تعليق'
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    executeAction();
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <textarea 
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="اكتب تعليقك..."
          className="w-full p-2 border rounded"
        />
        <button 
          type="submit" 
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          نشر التعليق
        </button>
      </form>
      {LoginPrompt()}
    </div>
  );
}
```

## How It Works

1. When a user tries to perform an action that requires authentication:
   - If the user is logged in, the action is executed immediately
   - If the user is not logged in, a login prompt is shown

2. The login prompt gives the user the option to:
   - Log in (redirects to the login page)
   - Cancel the action

3. After logging in, the user is returned to the original page and can retry the action

## Styling

The components come with basic styling, but you can customize the appearance by:

1. Modifying the CSS in `SessionVerification.module.css`
2. Adding your own styles and overriding the default styles using CSS modules or global styles

## Best Practices

- Use the `SessionVerification` component for simple UI elements like buttons
- Use the `useSessionAction` hook for more complex components or when you need more control over the action flow
- Always provide a meaningful `actionName` to help users understand what action requires authentication
- Handle loading and error states in your action functions for a better user experience
