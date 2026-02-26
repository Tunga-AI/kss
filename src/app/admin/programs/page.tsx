'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminProgramsPage from './programs-list';
import AdminEventsPage from './events-list';
import AdminCorporateProgramsPage from './corporate-programs-list';

export default function ProgramsHubPage() {
    return (
        <div className="w-full bg-gray-50/50 min-h-screen pb-20">
            <div className="w-full p-2 md:p-4">
                <Tabs defaultValue="programs" className="w-full">
                    <TabsList className="mb-2 bg-white border border-primary/10 shadow-sm p-1 rounded-tl-xl rounded-br-xl h-auto">
                        <TabsTrigger
                            value="programs"
                            className="font-bold text-[10px] md:text-xs uppercase tracking-widest px-4 md:px-8 h-10 md:h-12 data-[state=active]:bg-primary data-[state=active]:text-white transition-all rounded-tl-lg rounded-br-lg"
                        >
                            Public Programs
                        </TabsTrigger>
                        <TabsTrigger
                            value="corporate"
                            className="font-bold text-[10px] md:text-xs uppercase tracking-widest px-4 md:px-8 h-10 md:h-12 data-[state=active]:bg-accent data-[state=active]:text-white transition-all rounded-tl-lg rounded-br-lg"
                        >
                            Corporate Programs
                        </TabsTrigger>
                        <TabsTrigger
                            value="events"
                            className="font-bold text-[10px] md:text-xs uppercase tracking-widest px-4 md:px-8 h-10 md:h-12 data-[state=active]:bg-secondary data-[state=active]:text-white transition-all rounded-tl-lg rounded-br-lg"
                        >
                            Events
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="programs" className="m-0 p-0 border-none outline-none focus:outline-none focus-visible:outline-none">
                        <div className="-mx-2 md:-mx-4"><AdminProgramsPage /></div>
                    </TabsContent>

                    <TabsContent value="corporate" className="m-0 p-0 border-none outline-none focus:outline-none focus-visible:outline-none">
                        <div className="-mx-2 md:-mx-4"><AdminCorporateProgramsPage /></div>
                    </TabsContent>

                    <TabsContent value="events" className="m-0 p-0 border-none outline-none focus:outline-none focus-visible:outline-none">
                        <div className="-mx-2 md:-mx-4"><AdminEventsPage /></div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
