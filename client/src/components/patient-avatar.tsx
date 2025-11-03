import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { differenceInYears } from "date-fns";

interface PatientAvatarProps {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  age?: number;
  gender?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function PatientAvatar({
  firstName,
  lastName,
  dateOfBirth,
  age,
  gender,
  size = "md"
}: PatientAvatarProps) {
  // Calculate age from DOB or use provided age
  const calculatedAge = dateOfBirth 
    ? differenceInYears(new Date(), new Date(dateOfBirth))
    : age || 0;

  // Determine if patient is a child (under 18)
  const isChild = calculatedAge < 18;
  const isMale = gender?.toLowerCase() === "male";
  const isFemale = gender?.toLowerCase() === "female";

  // Size mappings
  const sizeClasses = {
    sm: "w-8 h-8 text-sm",
    md: "w-12 h-12 text-lg",
    lg: "w-16 h-16 text-2xl",
    xl: "w-24 h-24 text-4xl"
  };

  // Get initials fallback
  const initials = firstName && lastName 
    ? `${firstName[0]}${lastName[0]}`.toUpperCase()
    : "??";

  // Choose avatar icon based on age and gender
  let avatarIcon = "👤"; // Default adult
  let bgColor = "bg-gray-100";
  let textColor = "text-gray-700";

  if (isChild) {
    if (isMale) {
      avatarIcon = "👦"; // Boy
      bgColor = "bg-blue-100";
      textColor = "text-blue-700";
    } else if (isFemale) {
      avatarIcon = "👧"; // Girl
      bgColor = "bg-pink-100";
      textColor = "text-pink-700";
    } else {
      avatarIcon = "🧒"; // Child (gender neutral)
      bgColor = "bg-purple-100";
      textColor = "text-purple-700";
    }
  } else {
    // Adults
    if (isMale) {
      avatarIcon = "👨"; // Man
      bgColor = "bg-blue-100";
      textColor = "text-blue-700";
    } else if (isFemale) {
      avatarIcon = "👩"; // Woman
      bgColor = "bg-pink-100";
      textColor = "text-pink-700";
    } else {
      avatarIcon = "👤"; // Adult (gender neutral)
      bgColor = "bg-purple-100";
      textColor = "text-purple-700";
    }
  }

  return (
    <Avatar className={sizeClasses[size]}>
      <AvatarFallback className={`${bgColor} ${textColor} font-bold`}>
        {avatarIcon}
      </AvatarFallback>
    </Avatar>
  );
}

interface PatientAvatarWithInitialsProps extends PatientAvatarProps {
  showInitials?: boolean;
}

export function PatientAvatarWithInitials({
  firstName,
  lastName,
  dateOfBirth,
  age,
  gender,
  size = "md",
  showInitials = true
}: PatientAvatarWithInitialsProps) {
  const initials = firstName && lastName 
    ? `${firstName[0]}${lastName[0]}`.toUpperCase()
    : "??";

  const sizeClasses = {
    sm: "w-8 h-8 text-sm",
    md: "w-12 h-12 text-lg",
    lg: "w-16 h-16 text-2xl",
    xl: "w-24 h-24 text-4xl"
  };

  if (showInitials && firstName && lastName) {
    return (
      <Avatar className={sizeClasses[size]}>
        <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">
          {initials}
        </AvatarFallback>
      </Avatar>
    );
  }

  return (
    <PatientAvatar
      firstName={firstName}
      lastName={lastName}
      dateOfBirth={dateOfBirth}
      age={age}
      gender={gender}
      size={size}
    />
  );
}
