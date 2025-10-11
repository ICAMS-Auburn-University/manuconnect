import {
  Html,
  Body,
  Heading,
  Img,
  Section,
  Tailwind,
  Link,
} from '@react-email/components';
interface EmailTemplateProps {
  children: React.ReactNode;
  email: string;
}

export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
  children,
  email,
}) => (
  <Html lang="en">
    <Tailwind>
      <Body>
        <Heading className="flex items-center justify-center text-center mt-8 mb-4">
          <Img
            src="https://i.imgur.com/W6iZOls.png"
            alt="ManuConnect Logo"
            width={200}
          />
        </Heading>
        {children}
        <Section className="text-center text-sm text-gray-500 mt-4">
          <p>
            This email was sent to {email}. If you did not expect to receive
            this email, please{' '}
            <Link href="mailto:support@manuconnect.org">contact us</Link>.
          </p>
          <p>© {new Date().getFullYear()} ManuConnect. All rights reserved.</p>
        </Section>
      </Body>
    </Tailwind>
  </Html>
);
