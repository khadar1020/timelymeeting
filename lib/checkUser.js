import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

const makeUsername = (user) => {
  const emailName = user.emailAddresses[0]?.emailAddress?.split("@")[0];
  const rawName =
    [user.firstName, user.lastName].filter(Boolean).join("_") ||
    emailName ||
    "user";
  const cleanName = rawName.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 14);

  return `${cleanName}_${user.id.slice(-4)}`;
};

export const checkUser = async () => {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  try {
    const loggedInUser = await db?.user.findUnique({
      where: {
        clerkUserId: user.id,
      },
    });

    if (loggedInUser) {
      return loggedInUser;
    }

    const email = user.emailAddresses[0]?.emailAddress;
    const name =
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      email?.split("@")[0] ||
      "TimelyMeet User";
    const username = makeUsername(user);

    if (!email) {
      throw new Error("Signed-in user does not have an email address");
    }

    const newUser = await db.user.create({
      data: {
        clerkUserId: user.id,
        name,
        imageUrl: user.imageUrl,
        email: user.emailAddresses[0].emailAddress,
        username,
      },
    });

    await clerkClient()
      .users.updateUser(user.id, { username })
      .catch((error) => {
        console.error("Failed to sync username to Clerk:", error);
      });

    return newUser;
  } catch (error) {
    console.error("Failed to check or create user:", error);
    throw error;
  }
};
