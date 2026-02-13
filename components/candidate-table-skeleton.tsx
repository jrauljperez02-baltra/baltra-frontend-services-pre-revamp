import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

const CandidateTableSkeleton = () => {
    return (
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Rol</TableHead>
                            <TableHead>Fecha de Evaluación</TableHead>
                            <TableHead>Recomendación</TableHead>
                            <TableHead>Puntuación</TableHead>
                            <TableHead>Estado del Proceso</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array.from({ length: 8 }).map((_, idx) => (
                            <CandidateTableRowSkeleton key={idx} />
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};

const CandidateTableRowSkeleton = () => {
    return (
        <TableRow className="hover:bg-muted/50">
            {/* Nombre */}
            <TableCell className="font-medium">
                <Skeleton className="h-4 w-32" />
            </TableCell>

            {/* Rol */}
            <TableCell>
                <Skeleton className="h-4 w-24" />
            </TableCell>

            {/* Fecha de Evaluación */}
            <TableCell>
                <Skeleton className="h-4 w-20" />
            </TableCell>

            {/* Recomendación */}
            <TableCell>
                <Skeleton className="h-6 w-20 rounded-full" />
            </TableCell>

            {/* Puntuación */}
            <TableCell>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-2 w-16 rounded-full" />
                    <Skeleton className="h-3 w-8" />
                </div>
            </TableCell>

            {/* Estado del Proceso */}
            <TableCell>
                <Skeleton className="h-6 w-24 rounded-full" />
            </TableCell>
        </TableRow>
    );
};

export { CandidateTableSkeleton, CandidateTableRowSkeleton };
