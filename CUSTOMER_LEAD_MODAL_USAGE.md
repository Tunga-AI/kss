# CustomerLeadModal Usage Guide

## Overview

The `CustomerLeadModal` is a React component that converts the original CustomerLead page into a modal dialog. It maintains all the original functionality while providing a better user experience by keeping users on the same page.

## Features

- ✅ All original form fields preserved
- ✅ Form validation (email, phone, required fields)
- ✅ Program pre-selection support
- ✅ Thank you flow with navigation to home page
- ✅ Responsive design
- ✅ Loading states and error handling
- ✅ Conditional form fields (social media platform, referral source)

## Component Props

```typescript
interface CustomerLeadModalProps {
  isOpen: boolean;           // Controls modal visibility
  onClose: () => void;       // Callback when modal is closed
  programId?: string;        // Optional: Pre-select a program
  programName?: string;      // Optional: Display program name
}
```

## Basic Usage

### 1. Import the Component

```typescript
import CustomerLeadModal from '../components/CustomerLeadModal';
```

### 2. Add State Management

```typescript
const [showLeadModal, setShowLeadModal] = useState(false);
```

### 3. Add the Modal to Your JSX

```typescript
<CustomerLeadModal
  isOpen={showLeadModal}
  onClose={() => setShowLeadModal(false)}
/>
```

### 4. Trigger the Modal

```typescript
<button onClick={() => setShowLeadModal(true)}>
  Contact Us
</button>
```

## Advanced Usage Examples

### With Program Pre-selection

```typescript
const [selectedProgram, setSelectedProgram] = useState<{
  id: string;
  name: string;
} | null>(null);

const openModalWithProgram = (programId: string, programName: string) => {
  setSelectedProgram({ id: programId, name: programName });
  setShowLeadModal(true);
};

// In JSX
<CustomerLeadModal
  isOpen={showLeadModal}
  onClose={() => {
    setShowLeadModal(false);
    setSelectedProgram(null);
  }}
  programId={selectedProgram?.id}
  programName={selectedProgram?.name}
/>
```

### Program Card Integration

```typescript
const ProgramCard = ({ program }) => (
  <div className="program-card">
    <h3>{program.programName}</h3>
    <p>{program.description}</p>
    <button 
      onClick={() => openModalWithProgram(program.id, program.programName)}
      className="bg-primary-600 text-white px-4 py-2 rounded"
    >
      Get More Information
    </button>
  </div>
);
```

## Integration Examples

### 1. Program Detail Page

The modal is already integrated into `ProgramDetailPage.tsx`:

```typescript
// State
const [showLeadModal, setShowLeadModal] = useState(false);

// Button
<button onClick={() => setShowLeadModal(true)}>
  Get Started
</button>

// Modal
<CustomerLeadModal
  isOpen={showLeadModal}
  onClose={() => setShowLeadModal(false)}
  programId={program?.id}
  programName={program?.programName}
/>
```

### 2. Programs Listing Page

The modal is integrated into `ProgramsPage.tsx` with a "Contact Us" section:

```typescript
// Contact Us Section
<section className="bg-primary-600 text-white">
  <h2>Ready to Transform Your Sales Career?</h2>
  <button onClick={() => setShowLeadModal(true)}>
    Contact Us
  </button>
</section>

// Modal
<CustomerLeadModal
  isOpen={showLeadModal}
  onClose={() => setShowLeadModal(false)}
/>
```

### 3. Custom Implementation

```typescript
const MyCustomPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);

  const handleProgramSelect = (program) => {
    setSelectedProgram(program);
    setShowModal(true);
  };

  return (
    <div>
      {/* Your content */}
      
      <CustomerLeadModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedProgram(null);
        }}
        programId={selectedProgram?.id}
        programName={selectedProgram?.name}
      />
    </div>
  );
};
```

## Form Fields

The modal includes all original form fields:

### Required Fields
- First Name
- Last Name
- Email Address
- WhatsApp Number
- Program Interested In
- Learning Goals

### Optional Fields
- Current Role
- Current Organization/Employer
- Preferred Intake
- Preferred Communication Method

### Conditional Fields
- Social Media Platform (when source is "social_media")
- Referral Source (when source is "referral")
- Staff/Student Name (when referral source is "staff_student")

## User Flow

1. **Modal Opens**: User clicks button to open modal
2. **Form Display**: Modal shows the lead form with all fields
3. **Program Pre-selection**: If programId/programName provided, program is pre-selected
4. **Form Submission**: User fills and submits the form
5. **Validation**: Form validates all required fields and formats
6. **Thank You**: On successful submission, shows thank you message
7. **Navigation**: When user closes modal after submission, navigates to home page

## Styling

The modal uses Tailwind CSS classes and follows the existing design system:

- **Colors**: Primary, Secondary, and Accent color schemes
- **Spacing**: Consistent padding and margins
- **Typography**: Matches existing font styles
- **Responsive**: Works on all screen sizes
- **Accessibility**: Proper focus management and keyboard navigation

## Error Handling

The modal includes comprehensive error handling:

- **Validation Errors**: Displayed inline with form fields
- **Network Errors**: Generic error messages for API failures
- **Loading States**: Spinner during form submission
- **Success States**: Clear confirmation of successful submission

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive
- Touch-friendly interface
- Keyboard navigation support

## Dependencies

The modal requires these dependencies:

```json
{
  "react": "^18.0.0",
  "react-router-dom": "^6.0.0",
  "lucide-react": "^0.263.0"
}
```

## Migration from CustomerLead Page

If you were previously using the CustomerLead page, here's how to migrate:

### Before (Page Navigation)
```typescript
navigate(`/lead?program=${programId}&programName=${programName}`);
```

### After (Modal)
```typescript
setShowLeadModal(true);
// Pass programId and programName as props
```

This provides a better user experience by keeping users on the same page while maintaining all the original functionality. 