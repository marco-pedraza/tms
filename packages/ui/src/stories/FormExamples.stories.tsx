import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../components/button';
import { Card } from '../components/card';
import { CheckboxInput } from '../components/checkboxinput';
import { Datepicker } from '../components/datepicker';
import { Input } from '../components/input';
import { MultiSelect } from '../components/multiselect';
import { Select } from '../components/select';
import { SwitchInput } from '../components/switchinput';
import { Text } from '../components/text';
import { Textarea } from '../components/textarea';
import { Timepicker } from '../components/timepicker';

const meta = {
  title: 'Examples/Form Layouts',
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

interface FormData {
  name: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  interests: string[];
  birthDate: string;
  appointmentTime: string;
  bio: string;
  newsletter: boolean;
  notifications: boolean;
  terms: boolean;
}

interface FormErrors {
  [key: string]: string;
}

const countryOptions = [
  { value: 'mx', label: 'México' },
  { value: 'us', label: 'United States' },
  { value: 'ca', label: 'Canada' },
];

const cityOptions = [
  { value: 'cdmx', label: 'Ciudad de México' },
  { value: 'gdl', label: 'Guadalajara' },
  { value: 'mty', label: 'Monterrey' },
  { value: 'tjn', label: 'Tijuana' },
];

const interestOptions = [
  { value: 'travel', label: 'Travel' },
  { value: 'technology', label: 'Technology' },
  { value: 'sports', label: 'Sports' },
  { value: 'music', label: 'Music' },
  { value: 'art', label: 'Art' },
];

function OneColumnForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    country: '',
    city: '',
    interests: [],
    birthDate: '',
    appointmentTime: '',
    bio: '',
    newsletter: false,
    notifications: true,
    terms: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.country) {
      newErrors.country = 'Country is required';
    }

    if (!formData.birthDate) {
      newErrors.birthDate = 'Birth date is required';
    }

    if (!formData.terms) {
      newErrors.terms = 'You must accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <div className="mb-8">
          <Text variant="xxl" fontWeight="bold" className="mb-2">
            User Registration
          </Text>
          <Text variant="sm" textColor="gray500" className="mb-4">
            Fill out the form below to create your account
          </Text>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {/* Single column layout */}
          <Input
            label="Full Name"
            placeholder="Enter your full name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            variant={errors.name ? 'destructive' : 'default'}
            feedback={errors.name}
          />

          <Input
            label="Email"
            type="email"
            placeholder="your.email@example.com"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            variant={errors.email ? 'destructive' : 'default'}
            feedback={errors.email}
          />

          <Input
            label="Phone"
            type="tel"
            placeholder="+52 123 456 7890"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
          />

          <Select
            label="Country"
            placeholder="Select your country"
            options={countryOptions}
            value={formData.country}
            onChange={(value) => setFormData({ ...formData, country: value })}
            feedback={errors.country}
            searchable
            searchPlaceholder="Search countries..."
          />

          <Select
            label="City"
            placeholder="Select your city"
            options={cityOptions}
            value={formData.city}
            onChange={(value) => setFormData({ ...formData, city: value })}
          />

          <MultiSelect
            label="Interests"
            placeholder="Select your interests"
            options={interestOptions}
            value={formData.interests}
            onChange={(values) =>
              setFormData({ ...formData, interests: values })
            }
            searchable
            searchPlaceholder="Search interests..."
          />

          <Datepicker
            label="Birth Date"
            placeholder="Select your birth date"
            value={formData.birthDate}
            onChange={(e) =>
              setFormData({ ...formData, birthDate: e.target.value })
            }
            variant={errors.birthDate ? 'destructive' : 'default'}
            feedback={errors.birthDate}
          />

          <Timepicker
            label="Preferred Appointment Time"
            placeholder="Select a time"
            value={formData.appointmentTime}
            onChange={(e) =>
              setFormData({ ...formData, appointmentTime: e.target.value })
            }
          />

          <Textarea
            label="Bio"
            placeholder="Tell us about yourself"
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            rows={4}
          />

          <CheckboxInput
            label="Subscribe to newsletter"
            description="Receive weekly updates and promotions"
            checked={formData.newsletter}
            onChange={(e) =>
              setFormData({ ...formData, newsletter: e.target.checked })
            }
          />

          <SwitchInput
            label="Enable notifications"
            description="Get notified about important updates"
            checked={formData.notifications}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, notifications: checked })
            }
          />

          <CheckboxInput
            label="I accept the terms and conditions"
            checked={formData.terms}
            onChange={(e) =>
              setFormData({ ...formData, terms: e.target.checked })
            }
            feedback={errors.terms}
          />

          <div className="flex gap-3 pt-6">
            <Button type="submit">{submitted ? '✓ Saved!' : 'Submit'}</Button>
            <Button
              type="button"
              variant="outlineGray"
              onClick={() => {
                setFormData({
                  name: '',
                  email: '',
                  phone: '',
                  country: '',
                  city: '',
                  interests: [],
                  birthDate: '',
                  appointmentTime: '',
                  bio: '',
                  newsletter: false,
                  notifications: true,
                  terms: false,
                });
                setErrors({});
              }}
            >
              Reset
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function TwoColumnForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    country: '',
    city: '',
    interests: [],
    birthDate: '',
    appointmentTime: '',
    bio: '',
    newsletter: false,
    notifications: true,
    terms: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.country) {
      newErrors.country = 'Country is required';
    }

    if (!formData.birthDate) {
      newErrors.birthDate = 'Birth date is required';
    }

    if (!formData.terms) {
      newErrors.terms = 'You must accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <div className="mb-8">
          <Text variant="xxl" fontWeight="bold" className="mb-2">
            User Registration
          </Text>
          <Text variant="sm" textColor="gray500" className="mb-4">
            Fill out the form below to create your account
          </Text>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {/* Two column layout */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Full Name"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              variant={errors.name ? 'destructive' : 'default'}
              feedback={errors.name}
            />

            <Input
              label="Email"
              type="email"
              placeholder="your.email@example.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              variant={errors.email ? 'destructive' : 'default'}
              feedback={errors.email}
              required
            />

            <Input
              label="Phone"
              type="tel"
              placeholder="+52 123 456 7890"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
            />

            <Select
              label="Country"
              placeholder="Select your country"
              options={countryOptions}
              value={formData.country}
              onChange={(value) => setFormData({ ...formData, country: value })}
              feedback={errors.country}
              searchable
              searchPlaceholder="Search countries..."
            />

            <Select
              label="City"
              placeholder="Select your city"
              options={cityOptions}
              value={formData.city}
              onChange={(value) => setFormData({ ...formData, city: value })}
            />

            <MultiSelect
              label="Interests"
              placeholder="Select your interests"
              options={interestOptions}
              value={formData.interests}
              onChange={(values) =>
                setFormData({ ...formData, interests: values })
              }
              searchable
              searchPlaceholder="Search interests..."
            />

            <Datepicker
              label="Birth Date"
              placeholder="Select your birth date"
              value={formData.birthDate}
              onChange={(e) =>
                setFormData({ ...formData, birthDate: e.target.value })
              }
              variant={errors.birthDate ? 'destructive' : 'default'}
              feedback={errors.birthDate}
            />

            <Timepicker
              label="Preferred Appointment Time"
              placeholder="Select a time"
              value={formData.appointmentTime}
              onChange={(e) =>
                setFormData({ ...formData, appointmentTime: e.target.value })
              }
            />
          </div>

          <Textarea
            label="Bio"
            placeholder="Tell us about yourself"
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            rows={4}
          />

          <CheckboxInput
            label="Subscribe to newsletter"
            description="Receive weekly updates and promotions"
            checked={formData.newsletter}
            onChange={(e) =>
              setFormData({ ...formData, newsletter: e.target.checked })
            }
          />

          <SwitchInput
            label="Enable notifications"
            description="Get notified about important updates"
            checked={formData.notifications}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, notifications: checked })
            }
          />

          <CheckboxInput
            label="I accept the terms and conditions"
            checked={formData.terms}
            onChange={(e) =>
              setFormData({ ...formData, terms: e.target.checked })
            }
            feedback={errors.terms}
          />

          <div className="flex gap-3 pt-6">
            <Button type="submit">{submitted ? '✓ Saved!' : 'Submit'}</Button>
            <Button
              type="button"
              variant="outlineGray"
              onClick={() => {
                setFormData({
                  name: '',
                  email: '',
                  phone: '',
                  country: '',
                  city: '',
                  interests: [],
                  birthDate: '',
                  appointmentTime: '',
                  bio: '',
                  newsletter: false,
                  notifications: true,
                  terms: false,
                });
                setErrors({});
              }}
            >
              Reset
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function ThreeColumnForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    country: '',
    city: '',
    interests: [],
    birthDate: '',
    appointmentTime: '',
    bio: '',
    newsletter: false,
    notifications: true,
    terms: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.country) {
      newErrors.country = 'Country is required';
    }

    if (!formData.birthDate) {
      newErrors.birthDate = 'Birth date is required';
    }

    if (!formData.terms) {
      newErrors.terms = 'You must accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Card>
        <div className="mb-8">
          <Text variant="xxl" fontWeight="bold" className="mb-2">
            User Registration
          </Text>
          <Text variant="sm" textColor="gray500" className="mb-4">
            Fill out the form below to create your account
          </Text>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {/* Three column layout */}
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Full Name"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              variant={errors.name ? 'destructive' : 'default'}
              feedback={errors.name}
            />

            <Input
              label="Email"
              type="email"
              placeholder="your.email@example.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              variant={errors.email ? 'destructive' : 'default'}
              feedback={errors.email}
              required
            />

            <Input
              label="Phone"
              type="tel"
              placeholder="+52 123 456 7890"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
            />

            <Select
              label="Country"
              placeholder="Select your country"
              options={countryOptions}
              value={formData.country}
              onChange={(value) => setFormData({ ...formData, country: value })}
              feedback={errors.country}
              searchable
              searchPlaceholder="Search countries..."
            />

            <Select
              label="City"
              placeholder="Select your city"
              options={cityOptions}
              value={formData.city}
              onChange={(value) => setFormData({ ...formData, city: value })}
            />

            <MultiSelect
              label="Interests"
              placeholder="Select your interests"
              options={interestOptions}
              value={formData.interests}
              onChange={(values) =>
                setFormData({ ...formData, interests: values })
              }
              searchable
              searchPlaceholder="Search interests..."
            />

            <Datepicker
              label="Birth Date"
              placeholder="Select your birth date"
              value={formData.birthDate}
              onChange={(e) =>
                setFormData({ ...formData, birthDate: e.target.value })
              }
              variant={errors.birthDate ? 'destructive' : 'default'}
              feedback={errors.birthDate}
            />

            <Timepicker
              label="Preferred Appointment Time"
              placeholder="Select a time"
              value={formData.appointmentTime}
              onChange={(e) =>
                setFormData({ ...formData, appointmentTime: e.target.value })
              }
            />
          </div>

          <Textarea
            label="Bio"
            placeholder="Tell us about yourself"
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            rows={4}
          />

          <CheckboxInput
            label="Subscribe to newsletter"
            description="Receive weekly updates and promotions"
            checked={formData.newsletter}
            onChange={(e) =>
              setFormData({ ...formData, newsletter: e.target.checked })
            }
          />

          <SwitchInput
            label="Enable notifications"
            description="Get notified about important updates"
            checked={formData.notifications}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, notifications: checked })
            }
          />

          <CheckboxInput
            label="I accept the terms and conditions"
            checked={formData.terms}
            onChange={(e) =>
              setFormData({ ...formData, terms: e.target.checked })
            }
            feedback={errors.terms}
          />

          <div className="flex gap-3 pt-6">
            <Button type="submit">{submitted ? '✓ Saved!' : 'Submit'}</Button>
            <Button
              type="button"
              variant="outlineGray"
              onClick={() => {
                setFormData({
                  name: '',
                  email: '',
                  phone: '',
                  country: '',
                  city: '',
                  interests: [],
                  birthDate: '',
                  appointmentTime: '',
                  bio: '',
                  newsletter: false,
                  notifications: true,
                  terms: false,
                });
                setErrors({});
              }}
            >
              Reset
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

/**
 * Single column form layout - ideal for mobile or narrow containers
 */
export const SingleColumn: Story = {
  render: () => <OneColumnForm />,
};

/**
 * Two column form layout - balanced layout for desktop
 */
export const TwoColumns: Story = {
  render: () => <TwoColumnForm />,
};

/**
 * Three column form layout - compact layout for wide screens
 */
export const ThreeColumns: Story = {
  render: () => <ThreeColumnForm />,
};
