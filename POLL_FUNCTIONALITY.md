# Poll Functionality - Live Sessions

## Overview
The poll functionality allows teachers to create quick polls during live sessions and students to vote on them in real-time.

## Features

### For Teachers (Host)
- **Create Polls**: Quick poll creation with custom questions and options
- **Real-time Results**: See vote counts and percentages in real-time
- **Close Polls**: Ability to close polls when finished
- **Response Tracking**: See who voted and how many total votes
- **Visual Feedback**: Success/error messages and loading states

### For Students
- **Vote on Polls**: Click to vote on poll options
- **See Results**: Real-time vote counts and percentages
- **Visual Feedback**: See which option they voted for
- **Status Awareness**: Know if polls are active or closed

## Technical Implementation

### Database Tables
- `polls`: Main poll data (question, creator, status)
- `poll_options`: Poll options (text for each choice)
- `poll_votes`: Individual votes (who voted for what)

### API Endpoints
- `GET /api/live/:id/polls`: Get all polls for a session
- `POST /api/live/:id/polls`: Create a new poll
- `POST /api/live/:id/polls/:pollId/vote`: Vote on a poll
- `POST /api/live/:id/polls/:pollId/close`: Close a poll

### Real-time Updates
- Polls refresh every 3 seconds automatically
- Immediate refresh after creating/voting/closing polls
- Real-time vote counts and percentages

## User Experience Improvements

### Teacher Experience
1. **Poll Creation**: Clear form with validation
2. **Real-time Monitoring**: See votes as they come in
3. **Easy Management**: Prominent close button
4. **Status Indicators**: Clear active/closed status
5. **Vote Summary**: Total votes and creator info

### Student Experience
1. **Simple Voting**: One-click voting
2. **Visual Feedback**: See their vote highlighted
3. **Results Display**: Vote counts and percentages
4. **Status Awareness**: Know when polls are closed

### Error Handling
- Validation for poll creation (question + 2+ options)
- Error messages for failed operations
- Success confirmations
- Loading states during operations

## Usage Instructions

### Creating a Poll (Teacher)
1. Enter a question in the "Question" field
2. Enter options separated by commas (e.g., "Yes, No, Maybe")
3. Click "Create Poll"
4. Poll appears immediately for all participants

### Voting on a Poll (Student)
1. Click on any option to vote
2. Your vote is highlighted in green
3. Vote counts update in real-time
4. Cannot change vote once submitted

### Closing a Poll (Teacher)
1. Click "Close Poll" button on any active poll
2. Poll status changes to "CLOSED"
3. Students can no longer vote
4. Results remain visible

## Troubleshooting

### Poll Disappears After Creation
- **Solution**: Polls now refresh every 3 seconds automatically
- **Debug**: Check browser console for API errors

### Can't See Responses
- **Solution**: Real-time updates every 3 seconds
- **Debug**: Check network tab for failed API calls

### Can't Close Polls
- **Solution**: Red "Close Poll" button is now more prominent
- **Debug**: Ensure you're the session host/teacher

### Vote Counts Not Updating
- **Solution**: Automatic refresh every 3 seconds
- **Debug**: Check if poll is closed or API errors exist
