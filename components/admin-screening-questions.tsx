"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, Pencil } from "lucide-react";
import { useCompany } from "@/context/CompanyContext";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchScreeningQuestions, type ScreeningQuestion } from "@/lib/admin-api";
import type { UserAttributes } from "@/lib/user-attributes";
import { AdminQuestionEditDialog } from "./admin-question-edit-dialog";

interface AdminScreeningQuestionsProps {
  selectedIds?: number[];
  selectedStore: string;
  dateRange: { startDate: string; endDate: string };
  attrs: UserAttributes;
}

function parseSelectedCompanyId(selected: string, fallbackCompanyId: number): number {
  if (!selected || selected === "all") return fallbackCompanyId;
  const m = selected.match(/(\d+)/);
  return m ? Number(m[1]) : fallbackCompanyId;
}

export function AdminScreeningQuestions({ selectedStore, selectedIds, dateRange, attrs }: AdminScreeningQuestionsProps) {
  const { companyId: baseCompanyId, isGroupOne, isAdmin } = useCompany();
  const companyId = useMemo(() => parseSelectedCompanyId(selectedStore, baseCompanyId), [selectedStore, baseCompanyId]);
  const queryClient = useQueryClient();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<ScreeningQuestion | null>(null);

  const apiParams = useMemo(() => {
    const dateParams = { start_date: dateRange.startDate, end_date: dateRange.endDate };
    if (selectedIds && selectedIds.length > 0) {
      return { ...dateParams, company_ids: selectedIds };
    }
    if (selectedStore === "all") {
      return { ...dateParams, company_ids: attrs.companiesIds ?? [] };
    }
    return { ...dateParams, scope: 'idcompany' as const };
  }, [selectedIds, selectedStore, dateRange, attrs.companiesIds]);

  const queryKey = ["admin-screening-questions", companyId, apiParams];

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKey,
    queryFn: async () => fetchScreeningQuestions(companyId, apiParams),
    enabled: !!attrs,
  });

  const handleEditClick = (question: ScreeningQuestion) => {
    setSelectedQuestion(question);
    setIsEditDialogOpen(true);
  };

  const handleViewClick = (question: ScreeningQuestion) => {
    setSelectedQuestion(question);
    setIsViewDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsViewDialogOpen(false);
    setIsEditDialogOpen(false);
    setSelectedQuestion(null);
  }

  const questions = (data ?? []).sort((a, b) => {
    const ap = (a.final_position ?? a.step_index ?? a.id ?? 0);
    const bp = (b.final_position ?? b.step_index ?? b.id ?? 0);
    return ap - bp;
  });
  const totalInitialResponses = questions[0]?.total_responses || 0;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Preguntas de Screening</CardTitle>
          <CardDescription>Flujo completo de preguntas del proceso de selección inicial</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && <div>Cargando preguntas...</div>}
          {isError && <div className="text-red-600">No se pudo cargar el flujo.</div>}
          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold">Candidatos Iniciaron Proceso</div>
                  <div className="text-sm text-muted-foreground">Total de interacciones iniciales</div>
                </div>
                <div className="text-2xl font-bold">{Number(totalInitialResponses).toLocaleString()}</div>
              </div>
            </div>

            <div className="space-y-4">
              {questions.map((q) => (
                <div key={q.id} className="p-4 rounded-lg border">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">Pregunta {(q.final_position ?? q.step_index ?? q.id)}</Badge>
                        <Badge variant="secondary" className="text-xs">{q.response_type}</Badge>
                      </div>
                      <h5 className="font-medium text-sm leading-relaxed">{q.short_title}</h5>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-sm font-medium">{q.total_responses.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">respuestas</div>
                      </div>

                        {(q.editable ?? true) && isAdmin && isGroupOne && (q.final_position === 1 || q.final_position === 11) && (
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0 bg-transparent" onClick={() => handleEditClick(q)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}

                      {/*<Button variant="outline" size="sm" className="h-8 w-8 p-0 bg-transparent" onClick={() => handleViewClick(q)}>*/}
                      {/*  <Eye className="h-4 w-4" />*/}
                      {/*</Button>*/}
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t">
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>Tasa de finalización en este paso</span>
                      <span>{totalInitialResponses ? ((q.total_responses / totalInitialResponses) * 100).toFixed(1) : "0.0"}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={handleDialogClose}>
          <DialogContent className="max-w-2xl">
              <DialogHeader>
                  <DialogTitle>Pregunta {(selectedQuestion?.final_position ?? selectedQuestion?.step_index ?? selectedQuestion?.id)} - Texto Completo</DialogTitle>
                  <DialogDescription>
                      Tipo de respuesta: {selectedQuestion?.response_type} · {selectedQuestion?.total_responses.toLocaleString()} respuestas totales
                  </DialogDescription>
              </DialogHeader>
              <div className="mt-4 space-y-4">
                  <div className="p-4 rounded-lg bg-muted/50 text-sm leading-relaxed whitespace-pre-line">
                    {selectedQuestion?.response_type === 'interactive' ? selectedQuestion?.template_text : selectedQuestion?.full_question}
                  </div>

                  {selectedQuestion?.response_type === 'interactive' && selectedQuestion.options && selectedQuestion.options.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Opciones:</h4>
                      <div className="space-y-2 rounded-md bg-muted p-3">
                          {selectedQuestion.options.map((option) => (
                              <div key={option[0]} className="text-sm p-2 border-b">
                                  {option[1]}
                              </div>
                          ))}
                      </div>
                    </div>
                  )}
              </div>
          </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <AdminQuestionEditDialog
        key={selectedQuestion?.id} // Force remount when question changes
        isOpen={isEditDialogOpen}
        onClose={handleDialogClose}
        question={selectedQuestion}
        queryKey={queryKey}
      />
    </>
  );
}