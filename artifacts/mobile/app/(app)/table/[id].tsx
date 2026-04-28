import { Feather } from "@expo/vector-icons";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type StyleProp,
  type ViewStyle,
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { FieldDisplay } from "@/components/FieldDisplay";
import { FieldsPanel } from "@/components/FieldsPanel";
import { FormView } from "@/components/FormView";
import { GalleryView } from "@/components/GalleryView";
import { KanbanBoard } from "@/components/KanbanBoard";
import { LoadingState } from "@/components/LoadingState";
import { useAuth, useCreds } from "@/contexts/AuthContext";
import {
  BASEROW_TABLE_EVENT_TYPES,
  useBaserowRealtime,
} from "@/hooks/useBaserowRealtime";
import { useColors } from "@/hooks/useColors";
import { useWebInsets } from "@/hooks/useWebInsets";
import {
  deleteRow,
  getPrimaryDisplay,
  listFields,
  listRows,
  listViewFilters,
  listViews,
  listViewSortings,
  type BaserowField,
  type BaserowRow,
} from "@/lib/baserow";

const PAGE_SIZE = 50;
type DisplayMode = "spreadsheet" | "cards";

export default function TableScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const webInsets = useWebInsets();
  const creds = useCreds();
  const { apiCall } = useAuth();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{
    id: string;
    name?: string;
    database?: string;
  }>();
  const tableId = Number(params.id);
  const tableName = (params.name as string) || "Table";
  const databaseName = params.database as string | undefined;

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedViewId, setSelectedViewId] = useState<number | null>(null);
  const [sortFieldId, setSortFieldId] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [sortModalOpen, setSortModalOpen] = useState(false);
  const [fieldsPanelOpen, setFieldsPanelOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [selectedRowIds, setSelectedRowIds] = useState<number[]>([]);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("spreadsheet");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fieldsQuery = useQuery({
    queryKey: ["fields", creds.baseUrl, tableId],
    queryFn: () => apiCall((c) => listFields(c, tableId)),
    enabled: Number.isFinite(tableId),
  });

  const viewsQuery = useQuery({
    queryKey: ["views", creds.baseUrl, tableId],
    queryFn: () => apiCall((c) => listViews(c, tableId)),
    enabled: Number.isFinite(tableId),
  });

  const viewFiltersQuery = useQuery({
    queryKey: ["view-filters", creds.baseUrl, selectedViewId],
    queryFn: () => apiCall((c) => listViewFilters(c, selectedViewId ?? 0)),
    enabled: Number.isFinite(selectedViewId),
  });

  const viewSortingsQuery = useQuery({
    queryKey: ["view-sortings", creds.baseUrl, selectedViewId],
    queryFn: () => apiCall((c) => listViewSortings(c, selectedViewId ?? 0)),
    enabled: Number.isFinite(selectedViewId),
  });

  const manualOrderBy = useMemo(() => {
    if (!sortFieldId) return undefined;
    const prefix = sortDirection === "desc" ? "-" : "";
    return [`${prefix}field_${sortFieldId}`];
  }, [sortDirection, sortFieldId]);

  const rowsQuery = useInfiniteQuery({
    queryKey: [
      "rows",
      creds.baseUrl,
      tableId,
      debouncedSearch,
      selectedViewId,
      manualOrderBy?.join(",") ?? "",
    ],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      apiCall((c) =>
        listRows(c, tableId, {
          search: debouncedSearch,
          size: PAGE_SIZE,
          page: Number(pageParam),
          viewId: selectedViewId ?? undefined,
          orderBy: manualOrderBy,
        }),
      ),
    getNextPageParam: (lastPage, pages) => {
      const loaded = pages.reduce((sum, page) => sum + page.results.length, 0);
      return loaded < lastPage.count ? pages.length + 1 : undefined;
    },
    enabled: Number.isFinite(tableId),
  });

  const fields = useMemo(
    () => (fieldsQuery.data ?? []).slice().sort((a, b) => a.order - b.order),
    [fieldsQuery.data],
  );
  const secondaryFields = fields.filter((f) => !f.primary).slice(0, 2);
  const views = useMemo(
    () => (viewsQuery.data ?? []).slice().sort((a, b) => a.order - b.order),
    [viewsQuery.data],
  );
  const selectedView = useMemo(
    () => views.find((view) => view.id === selectedViewId) ?? null,
    [views, selectedViewId],
  );
  const flatRows = useMemo(
    () => rowsQuery.data?.pages.flatMap((page) => page.results) ?? [],
    [rowsQuery.data],
  );
  const totalRows = rowsQuery.data?.pages[0]?.count ?? 0;
  const sortField = fields.find((field) => field.id === sortFieldId) ?? null;
  const selectedRowSet = useMemo(() => new Set(selectedRowIds), [selectedRowIds]);

  useEffect(() => {
    if (views.length === 0) return;
    if (selectedViewId !== null) return;
    const firstGridView = views.find((view) => view.type === "grid") ?? views[0];
    setSelectedViewId(firstGridView?.id ?? null);
  }, [views, selectedViewId]);

  useEffect(() => {
    setSelectedRowIds([]);
    setSelectionMode(false);
  }, [debouncedSearch, selectedViewId, manualOrderBy?.join(",")]);

  useBaserowRealtime(
    creds,
    Number.isFinite(tableId) ? { page: "table", tableId } : null,
    (message) => {
      if (!message.type || !BASEROW_TABLE_EVENT_TYPES.has(message.type)) return;
      queryClient.invalidateQueries({
        queryKey: ["fields", creds.baseUrl, tableId],
      });
      queryClient.invalidateQueries({
        queryKey: ["views", creds.baseUrl, tableId],
      });
      queryClient.invalidateQueries({
        queryKey: ["rows", creds.baseUrl, tableId],
      });
      if (selectedViewId) {
        queryClient.invalidateQueries({
          queryKey: ["view-filters", creds.baseUrl, selectedViewId],
        });
        queryClient.invalidateQueries({
          queryKey: ["view-sortings", creds.baseUrl, selectedViewId],
        });
      }
    },
  );

  const deleteMutation = useMutation({
    mutationFn: (rowId: number) => apiCall((c) => deleteRow(c, tableId, rowId)),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["rows", creds.baseUrl, tableId],
      });
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error ? err.message : "Could not delete this row.";
      if (Platform.OS === "web") {
        window.alert(message);
      } else {
        Alert.alert("Delete failed", message);
      }
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (rowIds: number[]) => {
      for (const rowId of rowIds) {
        await apiCall((c) => deleteRow(c, tableId, rowId));
      }
    },
    onSuccess: () => {
      setSelectedRowIds([]);
      setSelectionMode(false);
      queryClient.invalidateQueries({
        queryKey: ["rows", creds.baseUrl, tableId],
      });
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error ? err.message : "Could not delete the selected rows.";
      if (Platform.OS === "web") {
        window.alert(message);
      } else {
        Alert.alert("Bulk delete failed", message);
      }
    },
  });

  const toggleRowSelected = useCallback((rowId: number) => {
    setSelectedRowIds((prev) =>
      prev.includes(rowId) ? prev.filter((id) => id !== rowId) : [...prev, rowId],
    );
  }, []);

  const confirmDelete = useCallback(
    (row: BaserowRow) => {
      const label = getPrimaryDisplay(row, fields) || `Row ${row.id}`;
      const message = `Delete "${label}"? This cannot be undone.`;
      if (Platform.OS === "web") {
        if (window.confirm(message)) {
          deleteMutation.mutate(row.id);
        }
        return;
      }
      Alert.alert("Delete row", message, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteMutation.mutate(row.id),
        },
      ]);
    },
    [deleteMutation, fields],
  );

  const confirmBulkDelete = useCallback(() => {
    const count = selectedRowIds.length;
    if (count === 0) return;
    const message =
      count === 1
        ? "Delete the selected row? This cannot be undone."
        : `Delete ${count} selected rows? This cannot be undone.`;
    if (Platform.OS === "web") {
      if (window.confirm(message)) {
        bulkDeleteMutation.mutate(selectedRowIds);
      }
      return;
    }
    Alert.alert("Delete selected rows", message, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => bulkDeleteMutation.mutate(selectedRowIds),
      },
    ]);
  }, [bulkDeleteMutation, selectedRowIds]);

  const appliedFilterLabels = useMemo(() => {
    if (!selectedView) return [];
    if (selectedView.filters_disabled) return ["Filters disabled for this view"];
    return (viewFiltersQuery.data ?? [])
      .map((filter) => {
        const field = fields.find((item) => item.id === filter.field);
        return field
          ? `${field.name} · ${filter.type} · ${filter.value || "set"}`
          : `Filter ${filter.id}`;
      })
      .slice(0, 4);
  }, [fields, selectedView, viewFiltersQuery.data]);

  const savedSortLabels = useMemo(() => {
    return (viewSortingsQuery.data ?? [])
      .map((sorting) => {
        const field = fields.find((item) => item.id === sorting.field);
        const direction = String(sorting.order).toLowerCase() === "desc" ? "desc" : "asc";
        return field ? `${field.name} ${direction}` : `Sort ${sorting.id}`;
      })
      .slice(0, 4);
  }, [fields, viewSortingsQuery.data]);

  const bottomPad = Math.max(insets.bottom, webInsets.bottom, 16);

  const renderItem = ({ item }: { item: BaserowRow }) => {
    const isSelected = selectedRowSet.has(item.id);
    const isDeleting =
      deleteMutation.isPending && deleteMutation.variables === item.id;

    return (
      <Pressable
        onPress={() => {
          if (selectionMode) {
            toggleRowSelected(item.id);
            return;
          }
          router.push({
            pathname: "/(app)/row/[tableId]/[rowId]",
            params: {
              tableId: String(tableId),
              rowId: String(item.id),
              tableName,
            },
          });
        }}
        onLongPress={() => {
          if (selectionMode) {
            toggleRowSelected(item.id);
            return;
          }
          setSelectionMode(true);
          setSelectedRowIds([item.id]);
        }}
        delayLongPress={320}
        style={({ pressed }) => [
          styles.row,
          {
            backgroundColor: pressed ? colors.surface : colors.card,
            borderColor: isSelected ? colors.primary : colors.border,
            borderRadius: colors.radius,
            opacity:
              isDeleting ||
              (bulkDeleteMutation.isPending && selectedRowSet.has(item.id))
                ? 0.5
                : 1,
          },
        ]}
      >
        {selectionMode ? (
          <Feather
            name={isSelected ? "check-circle" : "circle"}
            size={20}
            color={isSelected ? colors.primary : colors.mutedForeground}
          />
        ) : null}
        <View style={{ flex: 1 }}>
          <Text
            style={[styles.rowTitle, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {getPrimaryDisplay(item, fields)}
          </Text>
          {secondaryFields.map((field) => {
            const value = item[field.name];
            if (value === null || value === undefined || value === "") return null;
            return (
              <View key={field.id} style={styles.secondaryRow}>
                <Text
                  style={[styles.secondaryLabel, { color: colors.mutedForeground }]}
                  numberOfLines={1}
                >
                  {field.name}
                </Text>
                <View style={{ flex: 1 }}>
                  <FieldDisplay field={field} value={value} compact />
                </View>
              </View>
            );
          })}
        </View>
        <Feather
          name={selectionMode ? "minus-circle" : "chevron-right"}
          size={18}
          color={colors.mutedForeground}
        />
      </Pressable>
    );
  };

  const openRow = useCallback(
    (row: BaserowRow) => {
      router.push({
        pathname: "/(app)/row/[tableId]/[rowId]",
        params: {
          tableId: String(tableId),
          rowId: String(row.id),
          tableName,
        },
      });
    },
    [tableId, tableName],
  );

  const handleRowPress = useCallback(
    (row: BaserowRow) => {
      if (selectionMode) {
        toggleRowSelected(row.id);
        return;
      }
      openRow(row);
    },
    [openRow, selectionMode, toggleRowSelected],
  );

  const handleRowLongPress = useCallback(
    (row: BaserowRow) => {
      if (selectionMode) {
        toggleRowSelected(row.id);
        return;
      }
      setSelectionMode(true);
      setSelectedRowIds([row.id]);
    },
    [selectionMode, toggleRowSelected],
  );

  const isSpreadsheetMode =
    displayMode === "spreadsheet" &&
    (!selectedView || selectedView.type === "grid");

  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: tableName,
          headerRight: () => (
            <View style={styles.headerActions}>
              <Pressable
                onPress={() => setSelectionMode((prev) => !prev)}
                hitSlop={10}
                style={{ paddingHorizontal: 4 }}
              >
                <Feather
                  name={selectionMode ? "x-circle" : "check-square"}
                  size={20}
                  color={colors.foreground}
                />
              </Pressable>
              <Pressable
                onPress={() => setFieldsPanelOpen(true)}
                hitSlop={10}
                style={{ paddingHorizontal: 4 }}
              >
                <Feather name="columns" size={20} color={colors.foreground} />
              </Pressable>
              <Pressable
                onPress={() =>
                  setFormModalOpen(true)
                }
                hitSlop={10}
                style={{ paddingHorizontal: 4 }}
              >
                <Feather name="plus" size={22} color={colors.primary} />
              </Pressable>
            </View>
          ),
        }}
      />

      <View
        style={[
          styles.searchBar,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: colors.radius,
          },
        ]}
      >
        <Feather name="search" size={16} color={colors.mutedForeground} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={`Search ${tableName}`}
          placeholderTextColor={colors.mutedForeground}
          style={[styles.searchInput, { color: colors.foreground }]}
        />
        {search.length > 0 ? (
          <Pressable hitSlop={6} onPress={() => setSearch("")}>
            <Feather name="x" size={16} color={colors.mutedForeground} />
          </Pressable>
        ) : rowsQuery.isFetching && !rowsQuery.isLoading ? (
          <ActivityIndicator size="small" color={colors.mutedForeground} />
        ) : null}
      </View>

      <Text style={[styles.crumb, { color: colors.mutedForeground }]}>
        {databaseName ? `${databaseName} · ` : ""}
        {selectionMode
          ? `${selectedRowIds.length} selected`
          : "Long-press a row to multi-select"}
      </Text>

      {fieldsQuery.isLoading || viewsQuery.isLoading ? (
        <LoadingState />
      ) : fieldsQuery.isError || viewsQuery.isError ? (
        <ErrorState
          title="Could not load this table"
          message={
            (fieldsQuery.error instanceof Error && fieldsQuery.error.message) ||
            (viewsQuery.error instanceof Error && viewsQuery.error.message) ||
            undefined
          }
          onRetry={() => {
            fieldsQuery.refetch();
            viewsQuery.refetch();
          }}
        />
      ) : (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.toolbar}
            style={styles.toolbarScroll}
          >
            <View style={styles.toolbarSection}>
              <View
                style={[
                  styles.pill,
                  {
                    backgroundColor: colors.muted,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Feather name="eye" size={14} color={colors.mutedForeground} />
                <Text style={[styles.pillLabel, { color: colors.mutedForeground }]}>
                  Views
                </Text>
              </View>
              {views.map((view) => {
                const active = view.id === selectedViewId;
                return (
                  <Pressable
                    key={view.id}
                    onPress={() => setSelectedViewId(view.id)}
                    style={[
                      styles.pill,
                      {
                        backgroundColor: active ? colors.primary : colors.surface,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.pillLabel,
                        {
                          color: active
                            ? colors.primaryForeground
                            : colors.foreground,
                        },
                      ]}
                    >
                      {view.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.toolbarSection}>
              <Pressable
                onPress={() => setDisplayMode("spreadsheet")}
                style={[
                  styles.pill,
                  {
                    backgroundColor:
                      displayMode === "spreadsheet"
                        ? colors.primary
                        : colors.surface,
                    borderColor:
                      displayMode === "spreadsheet"
                        ? colors.primary
                        : colors.border,
                  },
                ]}
              >
                <Feather
                  name="grid"
                  size={14}
                  color={
                    displayMode === "spreadsheet"
                      ? colors.primaryForeground
                      : colors.foreground
                  }
                />
                <Text
                  style={[
                    styles.pillLabel,
                    {
                      color:
                        displayMode === "spreadsheet"
                          ? colors.primaryForeground
                          : colors.foreground,
                    },
                  ]}
                >
                  Table
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setDisplayMode("cards")}
                style={[
                  styles.pill,
                  {
                    backgroundColor:
                      displayMode === "cards" ? colors.primary : colors.surface,
                    borderColor:
                      displayMode === "cards" ? colors.primary : colors.border,
                  },
                ]}
              >
                <Feather
                  name="list"
                  size={14}
                  color={
                    displayMode === "cards"
                      ? colors.primaryForeground
                      : colors.foreground
                  }
                />
                <Text
                  style={[
                    styles.pillLabel,
                    {
                      color:
                        displayMode === "cards"
                          ? colors.primaryForeground
                          : colors.foreground,
                    },
                  ]}
                >
                  Cards
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setSortModalOpen(true)}
                style={[
                  styles.pill,
                  {
                    backgroundColor: sortField ? colors.primary : colors.surface,
                    borderColor: sortField ? colors.primary : colors.border,
                  },
                ]}
              >
                <Feather
                  name="sliders"
                  size={14}
                  color={sortField ? colors.primaryForeground : colors.foreground}
                />
                <Text
                  style={[
                    styles.pillLabel,
                    {
                      color: sortField
                        ? colors.primaryForeground
                        : colors.foreground,
                    },
                  ]}
                >
                  {sortField ? `${sortField.name} ${sortDirection}` : "Sort rows"}
                </Text>
              </Pressable>

              {sortField ? (
                <Pressable
                  onPress={() => {
                    setSortFieldId(null);
                    setSortDirection("asc");
                  }}
                  style={[
                    styles.pill,
                    {
                      backgroundColor: colors.muted,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Feather name="x" size={14} color={colors.mutedForeground} />
                  <Text
                    style={[styles.pillLabel, { color: colors.mutedForeground }]}
                  >
                    Clear
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </ScrollView>

          {selectedView ? (
            <View style={styles.metaSection}>
              <Text style={[styles.metaTitle, { color: colors.mutedForeground }]}>
                Applied from {selectedView.name}
              </Text>
              <View style={styles.metaRow}>
                {appliedFilterLabels.length > 0 ? (
                  appliedFilterLabels.map((label) => (
                    <MetaChip key={label} label={label} />
                  ))
                ) : (
                  <MetaChip label="No saved filters" />
                )}
              </View>
              <View style={styles.metaRow}>
                {savedSortLabels.length > 0 ? (
                  savedSortLabels.map((label) => (
                    <MetaChip key={label} label={label} />
                  ))
                ) : (
                  <MetaChip label="No saved sorting" />
                )}
              </View>
            </View>
          ) : null}

          {rowsQuery.isLoading ? (
            <LoadingState />
          ) : rowsQuery.isError ? (
            <ErrorState
              title="Could not load rows"
              message={
                rowsQuery.error instanceof Error
                  ? rowsQuery.error.message
                  : undefined
              }
              onRetry={() => rowsQuery.refetch()}
            />
          ) : flatRows.length === 0 ? (
            <EmptyState
              icon={debouncedSearch ? "search" : "list"}
              title={debouncedSearch ? "No matching rows" : "No rows yet"}
              description={
                debouncedSearch
                  ? "Try a different search term or switch views."
                  : "Tap the + button to add your first row."
              }
            />
          ) : selectedView?.type === "kanban" ? (
            <KanbanBoard
              rows={flatRows}
              fields={fields}
              onRowPress={(row) =>
                router.push({
                  pathname: "/(app)/row/[tableId]/[rowId]",
                  params: {
                    tableId: String(tableId),
                    rowId: String(row.id),
                    tableName,
                  },
                })
              }
            />
          ) : selectedView?.type === "gallery" ? (
            <GalleryView
              rows={flatRows}
              fields={fields}
              onRowPress={(row) =>
                router.push({
                  pathname: "/(app)/row/[tableId]/[rowId]",
                  params: {
                    tableId: String(tableId),
                    rowId: String(row.id),
                    tableName,
                  },
                })
              }
            />
          ) : selectedView?.type === "form" || formModalOpen ? (
            <FormView
              fields={fields}
              submitLabel="Add Row"
              onCancel={() => setFormModalOpen(false)}
              onSubmit={() => {
                setFormModalOpen(false);
                router.push({
                  pathname: "/(app)/row/[tableId]/new",
                  params: {
                    tableId: String(tableId),
                    tableName,
                  },
                });
              }}
            />
          ) : isSpreadsheetMode ? (
            <SpreadsheetTable
              rows={flatRows}
              fields={fields}
              selectedRowSet={selectedRowSet}
              selectionMode={selectionMode}
              bottomPad={bottomPad + (selectionMode ? 124 : 24)}
              totalRows={totalRows}
              hasMore={totalRows > flatRows.length || !!rowsQuery.hasNextPage}
              loadingMore={rowsQuery.isFetchingNextPage}
              onLoadMore={() => rowsQuery.fetchNextPage()}
              onRowPress={handleRowPress}
              onRowLongPress={handleRowLongPress}
            />
          ) : (
            <FlatList
              data={flatRows}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderItem}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingBottom: bottomPad + (selectionMode ? 124 : 24),
                gap: 10,
              }}
              refreshing={rowsQuery.isRefetching}
              onRefresh={() => rowsQuery.refetch()}
              ListFooterComponent={
                <View style={styles.footer}>
                  {(totalRows > flatRows.length || rowsQuery.hasNextPage) && (
                    <Button
                      title={
                        rowsQuery.isFetchingNextPage
                          ? "Loading more…"
                          : `Load more (${flatRows.length}/${totalRows})`
                      }
                      onPress={() => rowsQuery.fetchNextPage()}
                      loading={rowsQuery.isFetchingNextPage}
                      style={styles.loadMoreBtn}
                    />
                  )}
                  <Text
                    style={[styles.footerHint, { color: colors.mutedForeground }]}
                  >
                    Showing {flatRows.length} of {totalRows} rows
                  </Text>
                </View>
              }
            />
          )}
        </>
      )}

      {selectionMode ? (
        <View
          style={[
            styles.bulkBar,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              paddingBottom: bottomPad + 12,
            },
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.bulkTitle, { color: colors.foreground }]}>
              {selectedRowIds.length === 0
                ? "Select rows"
                : `${selectedRowIds.length} rows selected`}
            </Text>
            <Text
              style={[styles.bulkSubtitle, { color: colors.mutedForeground }]}
            >
              Delete multiple rows without leaving the table.
            </Text>
          </View>
          <View style={styles.bulkActions}>
            <Button
              title="Clear"
              variant="secondary"
              onPress={() => {
                setSelectedRowIds([]);
                setSelectionMode(false);
              }}
              style={styles.bulkButton}
            />
            <Button
              title="Delete"
              variant="destructive"
              onPress={confirmBulkDelete}
              disabled={selectedRowIds.length === 0}
              loading={bulkDeleteMutation.isPending}
              style={styles.bulkButton}
            />
          </View>
        </View>
      ) : null}

      <SortModal
        open={sortModalOpen}
        onClose={() => setSortModalOpen(false)}
        fields={fields}
        selectedFieldId={sortFieldId}
        direction={sortDirection}
        onSelectField={setSortFieldId}
        onDirectionChange={setSortDirection}
      />

      <FieldsPanel
        tableId={tableId}
        visible={fieldsPanelOpen}
        onClose={() => setFieldsPanelOpen(false)}
      />

      {!selectionMode && (
        <Pressable
          style={[
            styles.aiFab,
            {
              backgroundColor: colors.primary,
              bottom: bottomPad + 20,
              right: 20,
            },
          ]}
          onPress={() => {
            // Navigate to AI chat with workspace context
            // For now, we'll use the first workspace ID from the database
            // In a real app, you'd track the workspace ID properly
            router.push(`/ai-chat/1`);
          }}
        >
          <Feather name="message-circle" size={24} color="#fff" />
        </Pressable>
      )}
    </View>
  );
}

function SpreadsheetTable({
  rows,
  fields,
  selectedRowSet,
  selectionMode,
  bottomPad,
  totalRows,
  hasMore,
  loadingMore,
  onLoadMore,
  onRowPress,
  onRowLongPress,
}: {
  rows: BaserowRow[];
  fields: BaserowField[];
  selectedRowSet: Set<number>;
  selectionMode: boolean;
  bottomPad: number;
  totalRows: number;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  onRowPress: (row: BaserowRow) => void;
  onRowLongPress: (row: BaserowRow) => void;
}) {
  const colors = useColors();
  const visibleFields = fields.length > 0 ? fields : [];
  const tableMinWidth =
    ROW_NUMBER_COLUMN_WIDTH +
    visibleFields.reduce((sum, field) => sum + fieldColumnWidth(field), 0);

  return (
    <ScrollView
      style={styles.spreadsheetOuter}
      contentContainerStyle={{ paddingBottom: bottomPad }}
      showsVerticalScrollIndicator
    >
      <View
        style={[
          styles.spreadsheetFrame,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderRadius: colors.radius,
          },
        ]}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator>
          <View style={{ minWidth: tableMinWidth }}>
            <View
              style={[
                styles.gridHeaderRow,
                {
                  backgroundColor: colors.surface,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <View
                style={[
                  styles.rowNumberHeader,
                  {
                    width: ROW_NUMBER_COLUMN_WIDTH,
                    borderRightColor: colors.border,
                  },
                ]}
              >
                <Feather name="hash" size={13} color={colors.mutedForeground} />
              </View>
              {visibleFields.map((field) => (
                <View
                  key={field.id}
                  style={[
                    styles.gridHeaderCell,
                    fieldColumnStyle(field),
                    { borderRightColor: colors.border },
                  ]}
                >
                  <Feather
                    name={fieldIcon(field)}
                    size={13}
                    color={field.primary ? colors.primary : colors.mutedForeground}
                  />
                  <Text
                    style={[
                      styles.gridHeaderText,
                      { color: colors.foreground },
                    ]}
                    numberOfLines={1}
                  >
                    {field.name}
                  </Text>
                  {field.primary ? (
                    <View
                      style={[
                        styles.primaryBadge,
                        { backgroundColor: colors.secondary },
                      ]}
                    >
                      <Text
                        style={[
                          styles.primaryBadgeText,
                          { color: colors.primary },
                        ]}
                      >
                        Primary
                      </Text>
                    </View>
                  ) : null}
                </View>
              ))}
            </View>

            {rows.map((row, rowIndex) => {
              const selected = selectedRowSet.has(row.id);
              return (
                <View
                  key={row.id}
                  style={[
                    styles.gridDataRow,
                    {
                      backgroundColor: selected ? colors.secondary : colors.card,
                      borderBottomColor: colors.border,
                    },
                  ]}
                >
                  <Pressable
                    onPress={() => onRowPress(row)}
                    onLongPress={() => onRowLongPress(row)}
                    delayLongPress={320}
                    style={({ pressed }) => [
                      styles.rowNumberCell,
                      {
                        width: ROW_NUMBER_COLUMN_WIDTH,
                        backgroundColor: pressed ? colors.surface : "transparent",
                        borderRightColor: colors.border,
                      },
                    ]}
                  >
                    {selectionMode ? (
                      <Feather
                        name={selected ? "check-square" : "square"}
                        size={15}
                        color={selected ? colors.primary : colors.mutedForeground}
                      />
                    ) : (
                      <Text
                        style={[
                          styles.rowNumberText,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        {rowIndex + 1}
                      </Text>
                    )}
                  </Pressable>
                  {visibleFields.map((field) => (
                    <Pressable
                      key={`${row.id}-${field.id}`}
                      onPress={() => onRowPress(row)}
                      onLongPress={() => onRowLongPress(row)}
                      delayLongPress={320}
                      style={({ pressed }) => [
                        styles.gridCell,
                        fieldColumnStyle(field),
                        {
                          backgroundColor: pressed ? colors.surface : "transparent",
                          borderRightColor: colors.border,
                        },
                      ]}
                    >
                      <FieldDisplay field={field} value={row[field.name]} compact />
                    </Pressable>
                  ))}
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>

      <View style={styles.footer}>
        {hasMore ? (
          <Button
            title={loadingMore ? "Loading more…" : `Load more (${rows.length}/${totalRows})`}
            onPress={onLoadMore}
            loading={loadingMore}
            style={styles.loadMoreBtn}
          />
        ) : null}
        <Text style={[styles.footerHint, { color: colors.mutedForeground }]}>
          Spreadsheet table · Showing {rows.length} of {totalRows} rows
        </Text>
      </View>
    </ScrollView>
  );
}

const ROW_NUMBER_COLUMN_WIDTH = 56;

function fieldColumnWidth(field: BaserowField) {
  if (field.primary) return 220;
  if (field.type === "long_text") return 260;
  if (field.type === "boolean" || field.type === "rating") return 128;
  if (field.type === "date" || field.type === "created_on" || field.type === "last_modified") return 180;
  if (field.type === "file" || field.type === "link_row") return 220;
  return 176;
}

function fieldColumnStyle(field: BaserowField): StyleProp<ViewStyle> {
  return { width: fieldColumnWidth(field) };
}

function fieldIcon(field: BaserowField): keyof typeof Feather.glyphMap {
  if (field.primary) return "key";
  switch (field.type) {
    case "number":
    case "rating":
      return "hash";
    case "boolean":
      return "check-square";
    case "date":
    case "created_on":
    case "last_modified":
      return "calendar";
    case "single_select":
    case "multiple_select":
      return "tag";
    case "file":
      return "paperclip";
    case "link_row":
      return "link";
    case "url":
      return "external-link";
    case "email":
      return "mail";
    case "phone_number":
      return "phone";
    default:
      return "type";
  }
}

function MetaChip({ label }: { label: string }) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.metaChip,
        {
          backgroundColor: colors.muted,
          borderColor: colors.border,
        },
      ]}
    >
      <Text style={[styles.metaChipText, { color: colors.mutedForeground }]}>
        {label}
      </Text>
    </View>
  );
}

function SortModal({
  open,
  onClose,
  fields,
  selectedFieldId,
  direction,
  onSelectField,
  onDirectionChange,
}: {
  open: boolean;
  onClose: () => void;
  fields: BaserowField[];
  selectedFieldId: number | null;
  direction: "asc" | "desc";
  onSelectField: (fieldId: number | null) => void;
  onDirectionChange: (direction: "asc" | "desc") => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const webInsets = useWebInsets();
  const topPad = Math.max(insets.top, webInsets.top, 16);
  const bottomPad = Math.max(insets.bottom, webInsets.bottom, 16);

  return (
    <Modal
      visible={open}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle={Platform.OS === "ios" ? "pageSheet" : "fullScreen"}
    >
      <View style={[styles.modalRoot, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.modalHeader,
            {
              paddingTop: topPad + 12,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <Pressable hitSlop={10} onPress={onClose} style={{ paddingRight: 12 }}>
            <Text style={[styles.modalHeaderBtn, { color: colors.mutedForeground }]}>
              Close
            </Text>
          </Pressable>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>
            Sort rows
          </Text>
          <Pressable
            hitSlop={10}
            onPress={() => {
              onSelectField(null);
              onDirectionChange("asc");
              onClose();
            }}
            style={{ paddingLeft: 12 }}
          >
            <Text style={[styles.modalHeaderBtn, { color: colors.primary }]}>
              Reset
            </Text>
          </Pressable>
        </View>

        <View style={styles.modalSection}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            Direction
          </Text>
          <View style={styles.directionRow}>
            {(["asc", "desc"] as const).map((value) => {
              const active = direction === value;
              return (
                <Pressable
                  key={value}
                  onPress={() => onDirectionChange(value)}
                  style={[
                    styles.directionBtn,
                    {
                      backgroundColor: active ? colors.primary : colors.surface,
                      borderColor: active ? colors.primary : colors.border,
                      borderRadius: colors.radius,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.directionText,
                      {
                        color: active
                          ? colors.primaryForeground
                          : colors.foreground,
                      },
                    ]}
                  >
                    {value === "asc" ? "Ascending" : "Descending"}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: bottomPad + 24,
          }}
        >
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            Field
          </Text>
          {fields.map((field) => {
            const active = field.id === selectedFieldId;
            return (
              <Pressable
                key={field.id}
                onPress={() => onSelectField(active ? null : field.id)}
                style={[
                  styles.fieldOption,
                  {
                    backgroundColor: active ? colors.primary : colors.card,
                    borderColor: active ? colors.primary : colors.border,
                    borderRadius: colors.radius,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.fieldOptionTitle,
                      {
                        color: active
                          ? colors.primaryForeground
                          : colors.foreground,
                      },
                    ]}
                  >
                    {field.name}
                  </Text>
                  <Text
                    style={[
                      styles.fieldOptionMeta,
                      {
                        color: active
                          ? colors.primaryForeground
                          : colors.mutedForeground,
                      },
                    ]}
                  >
                    {field.type}
                  </Text>
                </View>
                <Feather
                  name={active ? "check-circle" : "circle"}
                  size={20}
                  color={active ? colors.primaryForeground : colors.mutedForeground}
                />
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 6,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    paddingVertical: 0,
  },
  crumb: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  toolbarScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  toolbar: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 10,
    alignItems: "center",
  },
  toolbarSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
  },
  pillLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  metaSection: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 6,
  },
  metaTitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  metaChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: "100%",
  },
  metaChipText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderWidth: 1,
  },
  rowTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    marginBottom: 2,
  },
  secondaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  secondaryLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    width: 80,
  },
  spreadsheetOuter: {
    flex: 1,
    paddingHorizontal: 12,
  },
  spreadsheetFrame: {
    borderWidth: 1,
    overflow: "hidden",
  },
  gridHeaderRow: {
    minHeight: 44,
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  rowNumberHeader: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
  },
  gridHeaderCell: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    borderRightWidth: 1,
  },
  gridHeaderText: {
    flex: 1,
    fontFamily: "Inter_700Bold",
    fontSize: 12,
  },
  primaryBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
  },
  primaryBadgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
  },
  gridDataRow: {
    minHeight: 52,
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  rowNumberCell: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
  },
  rowNumberText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  gridCell: {
    minHeight: 52,
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRightWidth: 1,
  },
  footer: {
    paddingTop: 16,
    paddingBottom: 4,
    gap: 12,
  },
  loadMoreBtn: {
    alignSelf: "stretch",
  },
  footerHint: {
    textAlign: "center",
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  bulkBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  bulkTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  bulkSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 2,
  },
  bulkActions: {
    flexDirection: "row",
    gap: 10,
  },
  bulkButton: {
    flex: 1,
  },
  modalRoot: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  modalHeaderBtn: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
  },
  modalTitle: {
    flex: 1,
    textAlign: "center",
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
  },
  modalSection: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 10,
  },
  sectionLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  directionRow: {
    flexDirection: "row",
    gap: 10,
  },
  directionBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    alignItems: "center",
  },
  directionText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  fieldOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
  },
  fieldOptionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  fieldOptionMeta: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 2,
  },
  aiFab: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});

export type RowItem = { field: BaserowField; value: unknown };
