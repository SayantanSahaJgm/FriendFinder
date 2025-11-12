import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mb-3 sm:mb-4 shadow-lg">
            <span className="text-white text-xl sm:text-2xl font-bold">FF</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            FriendFinder
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Connect with friends around you</p>
        </div>
        {children}
      </div>
    </div>
  );
}

