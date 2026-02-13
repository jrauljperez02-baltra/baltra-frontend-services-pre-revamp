'use client';

import Image from 'next/image';
import { useAuthenticator } from '@aws-amplify/ui-react';

const Header = () => {
    const { user, signOut } = useAuthenticator((ctx: any) => [ctx.user]);

    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex flex-col items-center mb-6">
                <Image
                    src="https://photos.wellfound.com/startups/i/10447547-67218e67ef130eddbb30ec39dd0afef8-medium_jpg.jpg?buster=1741572114"
                    alt="Logo Baltra"
                    width={80}
                    height={80}
                    className="rounded-lg"
                />
            </div>

            <p className="text-lg font-medium text-gray-700">
                Inicia sesión en{' '}
                <span className="text-[#0A2A5B] font-semibold">Baltra</span>{' '}
                para continuar.
            </p>

            {user && (
                <button
                    onClick={signOut}
                    className="mt-6 flex items-center gap-2 rounded-md border border-[#0A2A5B] px-4 py-2 text-sm font-medium text-[#0A2A5B] hover:bg-[#0A2A5B] hover:text-white transition"
                >
                    Cerrar sesión
                </button>
            )}
        </div>
    );
};

export default Header;
