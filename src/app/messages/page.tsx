"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  MessageCircle,
  Search,
  BarChart3,
  Filter,
  Users,
  User,
  Heart,
  TrendingUp,
  Smile,
  X,
  Download,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  isMessageMeaningful,
  getMessageStats,
  formatDuration,
  calculateConversationMomentum,
  type MessageStats,
  type ConversationMomentum,
  type InstagramMessage,
} from "@/lib/instagram-parser";
import {
  analyzeConversationSentiment,
  type ConversationSentiment,
} from "@/lib/sentiment-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInstagramData as useInstagramDataContext } from '@/contexts/instagram-data-context';


interface Message {
  sender_name: string;
  timestamp_ms: number;
  content?: string;
}

interface Conversation {
  id: string;
  participants: Array<{ name: string }>;
  messages: Message[];
}

type SortOption =
  | "most-messages"
  | "least-messages"
  | "recent"
  | "oldest"
  | "alphabetical";
type ChatFilter = "all" | "individual" | "group";
type MobileView = "conversations" | "messages" | "analysis";

// Helper function to highlight search terms
function highlightSearchTerm(text: string, searchTerm: string) {
  if (!searchTerm.trim()) return text;

  const regex = new RegExp(
    `(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
    "gi"
  );
  const parts = text.split(regex);

  return parts.map((part, index) =>
    regex.test(part) ? (
      <mark
        key={index}
        className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded"
      >
        {part}
      </mark>
    ) : (
      part
    )
  );
}

// Helper function to export conversation to CSV
function exportConversationToCSV(
  conversation: Conversation,
  participantName: string
) {
  const messages = conversation.messages.filter((msg) =>
    isMessageMeaningful(msg as InstagramMessage)
  );

  // Prepare CSV data - just the essentials
  const csvData = [
    // Headers
    ["Date", "Time", "Sender", "Message"].join(","),

    // Messages data
    ...messages.map((message) => {
      const date = new Date(message.timestamp_ms);

      return [
        date.toISOString().split("T")[0], // Date
        date.toTimeString().split(" ")[0], // Time
        `"${message.sender_name.replace(/"/g, '""')}"`, // Escape quotes
        `"${(message.content || "").replace(/"/g, '""')}"`, // Escape quotes
      ].join(",");
    }),
  ];

  // Create and download file
  const csvContent = csvData.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");

  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `${participantName.replace(/[^a-zA-Z0-9]/g, "_")}_messages.csv`
  );
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function Home() {
  const context = useInstagramDataContext();
  
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(
    null
  );
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [chatFilter, setChatFilter] = useState<ChatFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [messageSearchQuery, setMessageSearchQuery] = useState("");
  const [showOnlyMeaningful, setShowOnlyMeaningful] = useState(true);
  const [hoveredBar, setHoveredBar] = useState<{
    index: number;
    data: { date: string; messageCount: number };
  } | null>(null);
  const [conversationSentiment, setConversationSentiment] =
    useState<ConversationSentiment | null>(null);
  const [conversationMomentum, setConversationMomentum] =
    useState<ConversationMomentum | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    activity: true,
    sentiment: true,
  });
  const [mobileView, setMobileView] = useState<MobileView>("conversations");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get data from context
  const participants = context.participants || new Map();
  const conversations = context.conversations || new Map();
  const loading = !context.isLoaded;

  const getSortedParticipants = () => {
    let filtered = Array.from(participants.entries()).map(([id, participant]) => ({
      id,
      ...participant
    }));

    // Apply chat type filter
    if (chatFilter !== "all") {
      filtered = filtered.filter((participant) => {
        if (chatFilter === "group") return participant.isGroupChat;
        if (chatFilter === "individual") return !participant.isGroupChat;
        return true;
      });
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((participant) => {
        const nameMatch = participant.name.toLowerCase().includes(query);
        const usernameMatch = participant.username
          ?.toLowerCase()
          .includes(query);
        // For group chats, also search participant names
        const participantMatch =
          participant.isGroupChat &&
          participant.participantNames.some((name: string) =>
            name.toLowerCase().includes(query)
          );
        return nameMatch || usernameMatch || participantMatch;
      });
    }

    // Apply sorting
    switch (sortBy) {
      case "most-messages":
        return filtered.sort((a, b) => b.messageCount - a.messageCount);
      case "least-messages":
        return filtered.sort((a, b) => a.messageCount - b.messageCount);
      case "recent":
        return filtered.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
      case "oldest":
        return filtered.sort((a, b) => a.lastMessageTime - b.lastMessageTime);
      case "alphabetical":
        return filtered.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return filtered.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
    }
  };

  const filteredParticipants = getSortedParticipants();

  const selectedConversation = selectedParticipant
    ? conversations.get(selectedParticipant)
    : null;

  // Filter messages and calculate stats
  const filteredMessages = selectedConversation
    ? selectedConversation.messages.filter((message: Message) => {
        // Filter by meaningful messages
        const isMeaningful = showOnlyMeaningful
          ? isMessageMeaningful(message as unknown as InstagramMessage)
          : true;
        if (!isMeaningful) return false;

        // Filter by search query
        if (messageSearchQuery.trim()) {
          const searchLower = messageSearchQuery.toLowerCase().trim();
          return (
            message.content?.toLowerCase().includes(searchLower) ||
            message.sender_name.toLowerCase().includes(searchLower)
          );
        }

        return true;
      })
    : [];

  const messageStats: MessageStats | null = selectedConversation
    ? getMessageStats(
        selectedConversation.messages as unknown as InstagramMessage[]
      )
    : null;

  // Load sentiment analysis and momentum when conversation changes
  useEffect(() => {
    if (selectedConversation) {
      setConversationSentiment(null); // Reset to show loading
      setConversationMomentum(null);

      try {
        const result = analyzeConversationSentiment(
          selectedConversation.messages as unknown as InstagramMessage[]
        );
        setConversationSentiment(result);
      } catch (error) {
        console.error("Error analyzing sentiment:", error);
        setConversationSentiment(null);
      }

      // Calculate conversation momentum
      const momentum = calculateConversationMomentum(
        selectedConversation.messages as unknown as InstagramMessage[]
      );
      setConversationMomentum(momentum);
    } else {
      setConversationSentiment(null);
      setConversationMomentum(null);
    }
  }, [selectedConversation]);

  // Auto-scroll to bottom when conversation changes
  useEffect(() => {
    if (selectedParticipant && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedParticipant]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <div className="text-xl text-muted-foreground">
            Loading Instagram data...
          </div>
        </div>
      </div>
    );
  }

  if (!context.isLoaded && !loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="bg-card text-card-foreground p-6 rounded-lg shadow-lg border">
          <div className="text-xl text-muted-foreground">Please upload your Instagram data to get started</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Main Content - fills remaining height */}
      <div className="flex-1 flex gap-2 sm:gap-4 p-2 sm:p-4 min-h-0 max-w-full mx-auto w-full lg:pb-0 pb-16">
        {/* Left Sidebar - Conversations */}
        <Card
          className={`${
            mobileView === "conversations" ? "flex" : "hidden"
          } lg:flex w-full lg:w-80 flex-col h-full overflow-hidden`}
        >
          <CardContent className="p-3 sm:p-4 flex flex-col h-full">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base sm:text-lg font-semibold text-card-foreground flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Conversations</span>
                <span className="sm:hidden">Chats</span>
              </h2>
            </div>

            {/* Search */}
            <div className="mb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm bg-background border border-border rounded-md focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            {/* Compact Filter Controls */}
            <div className="mb-4 space-y-2">
              <div className="flex items-center gap-1 sm:gap-2 text-sm">
                <span className="text-muted-foreground hidden sm:inline">
                  Show:
                </span>
                <div className="flex gap-1 flex-wrap">
                  <button
                    onClick={() => setChatFilter("all")}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      chatFilter === "all"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setChatFilter("individual")}
                    className={`px-2 py-1 text-xs rounded flex items-center gap-1 transition-colors ${
                      chatFilter === "individual"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    <User className="h-3 w-3" />
                    <span className="hidden sm:inline">1:1</span>
                  </button>
                  <button
                    onClick={() => setChatFilter("group")}
                    className={`px-2 py-1 text-xs rounded flex items-center gap-1 transition-colors ${
                      chatFilter === "group"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    <Users className="h-3 w-3" />
                    <span className="hidden sm:inline">Groups</span>
                  </button>
                </div>
              </div>

              <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Recent first</SelectItem>
                  <SelectItem value="most-messages">Most messages</SelectItem>
                  <SelectItem value="least-messages">Least messages</SelectItem>
                  <SelectItem value="alphabetical">A-Z</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Participants List - Scrollable */}
            <div className="flex-1 overflow-y-auto space-y-1 min-h-0 scrollbar-thin">
              {filteredParticipants.map((participant) => (
                <div
                  key={participant.id}
                  onClick={() => {
                    setSelectedParticipant(participant.id);
                    // Auto-switch to messages view on mobile when conversation is selected
                    if (window.innerWidth < 1024) {
                      setMobileView("messages");
                    }
                  }}
                  className={cn(
                    "p-3 rounded-lg cursor-pointer transition-all duration-200 border active:scale-95",
                    selectedParticipant === participant.id
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-card hover:bg-accent border-border hover:border-accent-foreground/20"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-semibold truncate pr-2 text-sm sm:text-base">
                      {participant.name}
                    </div>
                    {participant.isGroupChat ? (
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 opacity-70" />
                        <span className="text-xs opacity-60">
                          {participant.participantCount}
                        </span>
                      </div>
                    ) : (
                      <User className="h-4 w-4 opacity-50" />
                    )}
                  </div>
                  <div className="text-sm opacity-70">
                    {participant.isGroupChat ? (
                      <span className="text-xs">
                        Group • {participant.participantCount} members
                      </span>
                    ) : (
                      <span>@{participant.username}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs opacity-60">
                      {participant.messageCount} messages
                    </span>
                    <span className="text-xs opacity-60">
                      {new Date(
                        participant.lastMessageTime
                      ).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Messages View - Takes middle space */}
        <Card
          className={`${
            mobileView === "messages" ? "flex" : "hidden"
          } lg:flex w-full flex-1 flex-col h-full overflow-hidden`}
        >
          <CardContent className="p-3 sm:p-6 flex flex-col h-full">
            {selectedConversation ? (
              <>
                {/* Header */}
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-semibold text-card-foreground truncate">
                      {selectedParticipant
                        ? participants.get(selectedParticipant)?.name ||
                          "Unknown"
                        : "Unknown"}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (selectedConversation && selectedParticipant) {
                          const participantName =
                            participants.get(selectedParticipant)?.name ||
                            "Unknown";
                          exportConversationToCSV(
                            selectedConversation,
                            participantName
                          );
                        }
                      }}
                      title="Export conversation to CSV"
                    >
                      <Download className="h-4 w-4" />
                      <span className="hidden sm:inline ml-1">Export</span>
                    </Button>
                    <span className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                      {messageSearchQuery ? (
                        <span>
                          {filteredMessages.length} search results
                          <span className="text-xs opacity-70 ml-1">
                            (of {selectedConversation.messages.length} total)
                          </span>
                        </span>
                      ) : (
                        <span>
                          {filteredMessages.length} /{" "}
                          {selectedConversation.messages.length} messages
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Message Filter Controls */}
                <div className="mb-4 space-y-3 flex-shrink-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-muted-foreground" />
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={showOnlyMeaningful}
                          onChange={(e) =>
                            setShowOnlyMeaningful(e.target.checked)
                          }
                          className="rounded border-border"
                        />
                        <span className="hidden sm:inline">
                          Show only meaningful messages
                        </span>
                        <span className="sm:hidden">Meaningful only</span>
                      </label>
                    </div>
                  </div>

                  {/* Message Search */}
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search messages..."
                      value={messageSearchQuery}
                      onChange={(e) => setMessageSearchQuery(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-md focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all"
                    />
                    {messageSearchQuery && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setMessageSearchQuery("")}
                        className="px-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Messages Container - fills remaining space */}
                <div className="flex-1 border border-border rounded-lg p-2 sm:p-4 overflow-y-auto space-y-3 bg-muted/20 min-h-0 scrollbar-thin">
                  {filteredMessages.map((message: Message, index: number) => {
                    // Find sentiment for this message
                    const messageSentiment =
                      conversationSentiment?.messageSentiments?.find(
                        (ms) => ms.content === message.content
                      );

                    return (
                      <div
                        key={index}
                        className={cn(
                          "flex",
                          message.sender_name === "Arjun Bhat"
                            ? "justify-end"
                            : "justify-start"
                        )}
                      >
                        <div className="flex items-start gap-1 sm:gap-2 max-w-[85%] sm:max-w-sm">
                          {/* Sentiment score for self messages (on the left of right-aligned messages) */}
                          {message.sender_name === "Arjun Bhat" &&
                            messageSentiment &&
                            messageSentiment.sentiment.label !== "neutral" && (
                              <div
                                className={cn(
                                  "px-1.5 py-0.5 rounded text-xs font-medium self-end mb-1",
                                  messageSentiment.sentiment.label ===
                                    "positive"
                                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                                )}
                              >
                                {messageSentiment.sentiment.score > 0
                                  ? "+"
                                  : ""}
                                {messageSentiment.sentiment.score.toFixed(1)}
                              </div>
                            )}

                          <div
                            className={cn(
                              "p-2 sm:p-3 rounded-2xl transition-all break-words border max-w-full",
                              message.sender_name === "Arjun Bhat"
                                ? "bg-primary text-primary-foreground border-primary/20 shadow-sm"
                                : "bg-muted text-muted-foreground border-border shadow-sm"
                            )}
                          >
                            <div className="text-sm break-words overflow-wrap-anywhere leading-relaxed">
                              {message.content
                                ? highlightSearchTerm(
                                    message.content,
                                    messageSearchQuery
                                  )
                                : "[Media/Attachment]"}
                            </div>
                            <div className="text-xs mt-1 opacity-70">
                              <span>
                                {new Date(message.timestamp_ms).toLocaleString(
                                  undefined,
                                  {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </span>
                            </div>
                          </div>

                          {/* Sentiment score for non-self messages (on the right of left-aligned messages) */}
                          {message.sender_name !== "Arjun Bhat" &&
                            messageSentiment &&
                            messageSentiment.sentiment.label !== "neutral" && (
                              <div
                                className={cn(
                                  "px-1.5 py-0.5 rounded text-xs font-medium self-end mb-1",
                                  messageSentiment.sentiment.label ===
                                    "positive"
                                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                                )}
                              >
                                {messageSentiment.sentiment.score > 0
                                  ? "+"
                                  : ""}
                                {messageSentiment.sentiment.score.toFixed(1)}
                              </div>
                            )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground p-8">
                <MessageCircle className="h-12 sm:h-16 w-12 sm:w-16 mb-4 opacity-20" />
                <div className="text-base sm:text-lg text-center">
                  Select a conversation to view messages
                </div>
                <div className="text-sm mt-2 opacity-70 text-center">
                  Choose from the conversations on the left
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Sidebar - Conversation Analysis */}
        <Card
          className={`${
            mobileView === "analysis" ? "flex" : "hidden"
          } xl:flex w-full xl:w-80 flex-col h-full overflow-hidden`}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden lg:inline">Analysis</span>
                <span className="lg:hidden">Stats</span>
              </CardTitle>
              {selectedParticipant && (
                <div className="text-sm text-muted-foreground truncate max-w-32 lg:max-w-40">
                  {participants.get(selectedParticipant)?.name || "Unknown"}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto space-y-6 scrollbar-thin">
            {selectedConversation && messageStats ? (
              <>
                {/* Message Overview - Collapsible */}
                <div>
                  <button
                    onClick={() =>
                      setExpandedSections((prev) => ({
                        ...prev,
                        overview: !prev.overview,
                      }))
                    }
                    className="w-full flex items-center justify-between p-2 hover:bg-muted/20 rounded transition-colors"
                  >
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Message Overview
                    </h3>
                    {expandedSections.overview ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>

                  {expandedSections.overview && (
                    <div className="mt-3">
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="bg-muted/30 rounded p-2">
                          <div className="text-muted-foreground">Total</div>
                          <div className="font-semibold text-lg">
                            {messageStats.totalMessages}
                          </div>
                        </div>
                        <div className="bg-muted/30 rounded p-2">
                          <div className="text-muted-foreground">
                            Meaningful
                          </div>
                          <div className="font-semibold text-lg">
                            {messageStats.meaningfulMessages}
                          </div>
                        </div>
                        <div className="bg-muted/30 rounded p-2">
                          <div className="text-muted-foreground">Photos</div>
                          <div className="font-semibold text-lg">
                            {messageStats.photos}
                          </div>
                        </div>
                        <div className="bg-muted/30 rounded p-2">
                          <div className="text-muted-foreground">Videos</div>
                          <div className="font-semibold text-lg">
                            {messageStats.videos}
                          </div>
                        </div>
                      </div>

                      {/* Additional overview stats */}
                      <div className="grid grid-cols-2 gap-3 text-xs mt-3">
                        <div className="bg-muted/30 rounded p-2">
                          <div className="text-muted-foreground">
                            Attachments
                          </div>
                          <div className="font-semibold text-lg">
                            {messageStats.attachments}
                          </div>
                        </div>
                        <div className="bg-muted/30 rounded p-2">
                          <div className="text-muted-foreground">
                            Audio Calls
                          </div>
                          <div className="font-semibold text-lg">
                            {messageStats.audioCalls}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Activity & Timing Analysis - Collapsible */}
                <div>
                  <button
                    onClick={() =>
                      setExpandedSections((prev) => ({
                        ...prev,
                        activity: !prev.activity,
                      }))
                    }
                    className="w-full flex items-center justify-between p-2 hover:bg-muted/20 rounded transition-colors"
                  >
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Activity & Timing
                    </h3>
                    {expandedSections.activity ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>

                  {expandedSections.activity && (
                    <div className="space-y-4 mt-3">
                      {/* Response Time Analysis */}
                      {messageStats.responseTimeAnalysis.averageResponseTime >
                        0 && (
                        <div>
                          <h4 className="font-medium text-xs text-muted-foreground mb-2">
                            Response Times
                          </h4>
                          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                            <div className="bg-muted/30 rounded p-2">
                              <div className="text-muted-foreground">
                                Average
                              </div>
                              <div className="font-semibold">
                                {formatDuration(
                                  messageStats.responseTimeAnalysis
                                    .averageResponseTime
                                )}
                              </div>
                            </div>
                            <div className="bg-muted/30 rounded p-2">
                              <div className="text-muted-foreground">
                                Median
                              </div>
                              <div className="font-semibold">
                                {formatDuration(
                                  messageStats.responseTimeAnalysis
                                    .medianResponseTime
                                )}
                              </div>
                            </div>
                            <div className="bg-muted/30 rounded p-2">
                              <div className="text-muted-foreground">
                                Fastest
                              </div>
                              <div className="font-semibold text-green-600">
                                {formatDuration(
                                  messageStats.responseTimeAnalysis
                                    .fastestResponse
                                )}
                              </div>
                            </div>
                            <div className="bg-muted/30 rounded p-2">
                              <div className="text-muted-foreground">
                                Slowest
                              </div>
                              <div className="font-semibold text-orange-600">
                                {formatDuration(
                                  messageStats.responseTimeAnalysis
                                    .slowestResponse
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Per-participant response patterns */}
                          <div className="space-y-2">
                            <h4 className="font-medium text-xs text-muted-foreground">
                              Response Patterns by Person
                            </h4>
                            {Object.entries(
                              messageStats.responseTimeAnalysis
                                .responseTimesByParticipant
                            ).map(
                              ([name, stats]) =>
                                stats.totalResponses > 0 && (
                                  <div
                                    key={name}
                                    className="bg-muted/30 rounded p-2 text-xs"
                                  >
                                    <div className="font-medium mb-1">
                                      {name}
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-xs">
                                      <div>
                                        <span className="text-muted-foreground">
                                          Avg:{" "}
                                        </span>
                                        <span className="font-medium">
                                          {formatDuration(
                                            stats.averageResponseTime
                                          )}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">
                                          Quick:{" "}
                                        </span>
                                        <span className="font-medium">
                                          {Math.round(
                                            messageStats.responseTimeAnalysis
                                              .responsiveness[name] || 0
                                          )}
                                          %
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">
                                          Started:{" "}
                                        </span>
                                        <span className="font-medium">
                                          {messageStats.responseTimeAnalysis
                                            .conversationStarters[name] || 0}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )
                            )}
                          </div>
                        </div>
                      )}

                      {/* Conversation Momentum */}
                      {conversationMomentum && (
                        <div>
                          <h4 className="font-medium text-xs text-muted-foreground mb-2">
                            Conversation Flow
                          </h4>
                          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                            <div className="bg-muted/30 rounded p-2">
                              <div className="text-muted-foreground">Trend</div>
                              <div
                                className={cn(
                                  "flex items-center gap-1 font-semibold",
                                  conversationMomentum.overallTrend ===
                                    "increasing"
                                    ? "text-green-600"
                                    : conversationMomentum.overallTrend ===
                                      "decreasing"
                                    ? "text-orange-600"
                                    : "text-blue-600"
                                )}
                              >
                                <TrendingUp
                                  className={cn(
                                    "h-3 w-3",
                                    conversationMomentum.overallTrend ===
                                      "decreasing" && "rotate-180"
                                  )}
                                />
                                {conversationMomentum.overallTrend}
                              </div>
                            </div>
                            <div className="bg-muted/30 rounded p-2">
                              <div className="text-muted-foreground">
                                Avg Gap
                              </div>
                              <div className="font-semibold">
                                {formatDuration(
                                  conversationMomentum.averageGapBetweenMessages *
                                    60
                                )}
                              </div>
                            </div>
                            <div className="bg-muted/30 rounded p-2">
                              <div className="text-muted-foreground">
                                Longest Quiet
                              </div>
                              <div className="font-semibold">
                                {conversationMomentum.longestQuietPeriod} days
                              </div>
                            </div>
                            <div className="bg-muted/30 rounded p-2">
                              <div className="text-muted-foreground">
                                Peak Days
                              </div>
                              <div className="font-semibold">
                                {conversationMomentum.peakPeriods.length}
                              </div>
                            </div>
                          </div>

                          {/* Peak periods */}
                          {conversationMomentum.peakPeriods.length > 0 && (
                            <div className="mb-3">
                              <h4 className="font-medium text-xs text-muted-foreground mb-2">
                                Most Active Days
                              </h4>
                              <div className="space-y-1">
                                {conversationMomentum.peakPeriods
                                  .slice(0, 5)
                                  .map((peak, index) => (
                                    <div
                                      key={index}
                                      className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs"
                                    >
                                      <div className="font-medium">
                                        {new Date(
                                          peak.date
                                        ).toLocaleDateString()}
                                      </div>
                                      <div className="font-semibold text-green-600">
                                        {peak.messageCount} messages
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}

                          {/* Quiet periods */}
                          {conversationMomentum.quietPeriods.length > 0 && (
                            <div>
                              <h4 className="font-medium text-xs text-muted-foreground mb-2">
                                Quiet Periods
                              </h4>
                              <div className="space-y-1">
                                {conversationMomentum.quietPeriods
                                  .slice(0, 3)
                                  .map((quiet, index) => (
                                    <div
                                      key={index}
                                      className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs"
                                    >
                                      <div className="font-medium">
                                        {new Date(
                                          quiet.startDate
                                        ).toLocaleDateString()}{" "}
                                        -{" "}
                                        {new Date(
                                          quiet.endDate
                                        ).toLocaleDateString()}
                                      </div>
                                      <div className="font-semibold text-orange-600">
                                        {quiet.durationDays} days
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Sentiment Analysis - Collapsible */}
                <div>
                  <button
                    onClick={() =>
                      setExpandedSections((prev) => ({
                        ...prev,
                        sentiment: !prev.sentiment,
                      }))
                    }
                    className="w-full flex items-center justify-between p-2 hover:bg-muted/20 rounded transition-colors"
                  >
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      Sentiment Analysis
                    </h3>
                    {expandedSections.sentiment ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>

                  {expandedSections.sentiment && (
                    <div className="space-y-4 mt-3">
                      {conversationSentiment ? (
                        <>
                          {/* Overall Mood */}
                          <div className="space-y-2 mb-4">
                            <h4 className="font-semibold text-sm flex items-center gap-2">
                              <Smile className="h-4 w-4" />
                              Overall Mood
                            </h4>
                            <div
                              className={cn(
                                "p-3 rounded-lg text-center border",
                                conversationSentiment.overallLabel ===
                                  "positive"
                                  ? "bg-green-500/20 border-green-500/30"
                                  : conversationSentiment.overallLabel ===
                                    "negative"
                                  ? "bg-red-500/20 border-red-500/30"
                                  : "bg-muted/20 border-border"
                              )}
                            >
                              <div className="font-medium capitalize text-lg">
                                {conversationSentiment.overallLabel}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Score:{" "}
                                {conversationSentiment.overallScore.toFixed(2)}
                              </div>
                            </div>
                          </div>

                          {/* Message Breakdown */}
                          <div className="space-y-3 mb-4">
                            <h4 className="font-semibold text-sm flex items-center gap-2">
                              <BarChart3 className="h-4 w-4" />
                              Message Breakdown
                            </h4>

                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-green-600">Positive</span>
                                <span>
                                  {conversationSentiment.positiveCount}
                                </span>
                              </div>
                              <Progress
                                value={
                                  (conversationSentiment.positiveCount /
                                    conversationSentiment.totalMessages) *
                                  100
                                }
                                className="h-2"
                              />
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Neutral</span>
                                <span>
                                  {conversationSentiment.neutralCount}
                                </span>
                              </div>
                              <Progress
                                value={
                                  (conversationSentiment.neutralCount /
                                    conversationSentiment.totalMessages) *
                                  100
                                }
                                className="h-2"
                              />
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-red-600">Negative</span>
                                <span>
                                  {conversationSentiment.negativeCount}
                                </span>
                              </div>
                              <Progress
                                value={
                                  (conversationSentiment.negativeCount /
                                    conversationSentiment.totalMessages) *
                                  100
                                }
                                className="h-2"
                              />
                            </div>
                          </div>

                          {/* Activity Over Time Chart */}
                          <div className="space-y-2 mb-4">
                            <h4 className="font-semibold text-sm flex items-center gap-2">
                              <TrendingUp className="h-4 w-4" />
                              Activity Over Time
                            </h4>
                            <div className="p-3 bg-muted/20 rounded-lg">
                              <div className="space-y-2">
                                {conversationSentiment.activityTrend &&
                                conversationSentiment.activityTrend.length >
                                  0 ? (
                                  <>
                                    <div className="text-xs text-muted-foreground mb-2">
                                      Daily activity across all time (
                                      {
                                        conversationSentiment.activityTrend
                                          .length
                                      }{" "}
                                      days with messages)
                                    </div>
                                    <div className="relative">
                                      <div className="flex items-end justify-between h-16 gap-px overflow-hidden">
                                        {conversationSentiment.activityTrend.map(
                                          (day, index) => {
                                            // Calculate message frequency for visualization
                                            const maxMessages = Math.max(
                                              ...conversationSentiment.activityTrend.map(
                                                (d) => d.messageCount
                                              )
                                            );
                                            const height = Math.max(
                                              1,
                                              (day.messageCount / maxMessages) *
                                                60
                                            );

                                            return (
                                              <div
                                                key={index}
                                                className="bg-primary/60 rounded-sm flex-1 transition-all hover:bg-primary/80 min-w-px cursor-pointer"
                                                style={{
                                                  height: `${height}px`,
                                                }}
                                                onMouseEnter={() =>
                                                  setHoveredBar({
                                                    index,
                                                    data: day,
                                                  })
                                                }
                                                onMouseLeave={() =>
                                                  setHoveredBar(null)
                                                }
                                              />
                                            );
                                          }
                                        )}
                                      </div>
                                      {hoveredBar && (
                                        <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-popover text-popover-foreground px-2 py-1 rounded shadow-md border text-xs whitespace-nowrap z-10">
                                          <div className="font-medium">
                                            {new Date(
                                              hoveredBar.data.date
                                            ).toLocaleDateString()}
                                          </div>
                                          <div>
                                            {hoveredBar.data.messageCount}{" "}
                                            messages
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                      <span>
                                        {new Date(
                                          conversationSentiment.activityTrend[0]?.date
                                        ).toLocaleDateString()}
                                      </span>
                                      <span>Each bar = 1 day</span>
                                      <span>
                                        {new Date(
                                          conversationSentiment.activityTrend[
                                            conversationSentiment.activityTrend
                                              .length - 1
                                          ]?.date
                                        ).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </>
                                ) : (
                                  <div className="text-xs text-muted-foreground text-center py-4">
                                    Not enough data for activity chart
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Most Positive Message */}
                          {conversationSentiment.mostPositiveMessage && (
                            <div className="space-y-2 mb-4">
                              <h4 className="font-semibold text-sm text-green-600">
                                Most Positive Message
                              </h4>
                              <div className="p-2 bg-muted/30 rounded text-xs">
                                <div className="font-medium">
                                  Score:{" "}
                                  {
                                    conversationSentiment.mostPositiveMessage
                                      .score
                                  }
                                </div>
                                <div className="mt-1 opacity-80">
                                  &quot;
                                  {conversationSentiment.mostPositiveMessage.content.slice(
                                    0,
                                    100
                                  )}
                                  ...&quot;
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Most Negative Message */}
                          {conversationSentiment.mostNegativeMessage && (
                            <div className="space-y-2 mb-4">
                              <h4 className="font-semibold text-sm text-red-600">
                                Most Negative Message
                              </h4>
                              <div className="p-2 bg-muted/30 rounded text-xs">
                                <div className="font-medium">
                                  Score:{" "}
                                  {
                                    conversationSentiment.mostNegativeMessage
                                      .score
                                  }
                                </div>
                                <div className="mt-1 opacity-80">
                                  &quot;
                                  {conversationSentiment.mostNegativeMessage.content.slice(
                                    0,
                                    100
                                  )}
                                  ...&quot;
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Quick Stats */}
                          <div className="space-y-2">
                            <h4 className="font-semibold text-sm flex items-center gap-2">
                              <TrendingUp className="h-4 w-4" />
                              Quick Stats
                            </h4>
                            <div className="text-xs space-y-1">
                              <div className="flex justify-between">
                                <span>Total analyzed:</span>
                                <span>
                                  {conversationSentiment.totalMessages}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Positivity ratio:</span>
                                <span>
                                  {(
                                    (conversationSentiment.positiveCount /
                                      conversationSentiment.totalMessages) *
                                    100
                                  ).toFixed(1)}
                                  %
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Trend data points:</span>
                                <span>
                                  {conversationSentiment.sentimentTrend.length}{" "}
                                  days
                                </span>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
                          <div className="text-sm">Analyzing sentiment...</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Heart className="h-12 w-12 mb-3 opacity-20" />
                <div className="text-sm text-center">
                  Select a conversation to see analysis
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mobile Bottom Tab Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border/50 z-50 safe-area-pb">
        <Tabs value={mobileView} onValueChange={(value) => setMobileView(value as MobileView)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-auto bg-transparent rounded-none border-0 p-0">
            <TabsTrigger 
              value="conversations" 
              className="relative flex flex-col items-center gap-1.5 py-3 px-4 text-xs font-medium transition-all duration-200 bg-transparent border-0 rounded-none data-[state=active]:bg-transparent data-[state=active]:text-primary hover:bg-muted/30"
            >
              <div className="relative">
                <Users className="h-6 w-6 transition-all duration-200" />
                {mobileView === "conversations" && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
                )}
              </div>
              <span className={cn(
                "transition-all duration-200",
                mobileView === "conversations" ? "font-semibold" : "font-normal"
              )}>
                People
              </span>
              {mobileView === "conversations" && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="messages"
              disabled={!selectedParticipant}
              className="relative flex flex-col items-center gap-1.5 py-3 px-4 text-xs font-medium transition-all duration-200 bg-transparent border-0 rounded-none data-[state=active]:bg-transparent data-[state=active]:text-primary hover:bg-muted/30 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <div className="relative">
                <MessageCircle className="h-6 w-6 transition-all duration-200" />
                {mobileView === "messages" && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
                )}
              </div>
              <span className={cn(
                "transition-all duration-200",
                mobileView === "messages" ? "font-semibold" : "font-normal"
              )}>
                Messages
              </span>
              {mobileView === "messages" && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="analysis"
              disabled={!selectedParticipant}
              className="relative flex flex-col items-center gap-1.5 py-3 px-4 text-xs font-medium transition-all duration-200 bg-transparent border-0 rounded-none data-[state=active]:bg-transparent data-[state=active]:text-primary hover:bg-muted/30 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <div className="relative">
                <BarChart3 className="h-6 w-6 transition-all duration-200" />
                {mobileView === "analysis" && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
                )}
              </div>
              <span className={cn(
                "transition-all duration-200",
                mobileView === "analysis" ? "font-semibold" : "font-normal"
              )}>
                Analysis
              </span>
              {mobileView === "analysis" && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}
