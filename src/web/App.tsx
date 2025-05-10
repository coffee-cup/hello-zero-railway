import { useState, MouseEvent, useRef } from "react";
import Cookies from "js-cookie";
import { useQuery, useZero } from "@rocicorp/zero/react";
import { escapeLike } from "@rocicorp/zero";
import { schema, Schema } from "../zero/zero-schema.gen";
import { randomMessage } from "./helpers/test-data";
import { randInt } from "./helpers/rand";
import { useInterval } from "./hooks/use-interval";
import { formatDate } from "./helpers/date";

function App() {
  const z = useZero<Schema>();
  const [users] = useQuery(z.query.users, {
    ttl: "forever",
  });

  const [mediums] = useQuery(z.query.mediums, {
    ttl: "forever",
  });

  const [filterUser, setFilterUser] = useState<string>("");
  const [filterText, setFilterText] = useState<string>("");

  const all = z.query.messages;
  const [allMessages] = useQuery(all, {
    ttl: "forever",
  });

  let filtered = all
    .related("medium")
    .related("sender")
    .orderBy("timestamp", "desc");

  if (filterUser) {
    filtered = filtered.where("senderId", filterUser);
  }

  if (filterText) {
    filtered = filtered.where("body", "LIKE", `%${escapeLike(filterText)}%`);
  }

  const [filteredMessages] = useQuery(filtered);

  const hasFilters = filterUser || filterText;
  const [action, setAction] = useState<"add" | "remove" | undefined>(undefined);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);

  const deleteRandomMessage = () => {
    if (allMessages.length === 0) {
      return false;
    }
    const index = randInt(allMessages.length);
    z.mutate.messages.delete({ id: allMessages[index].id });

    return true;
  };

  const addRandomMessage = () => {
    z.mutate.messages.insert(randomMessage(users, mediums));
    return true;
  };

  const handleAction = () => {
    if (action === "add") {
      return addRandomMessage();
    } else if (action === "remove") {
      return deleteRandomMessage();
    }

    return false;
  };

  useInterval(
    () => {
      if (!handleAction()) {
        setAction(undefined);
      }
    },
    action !== undefined ? 1000 / 60 : null
  );

  const INITIAL_HOLD_DELAY_MS = 300;
  const handleAddAction = () => {
    addRandomMessage();
    holdTimerRef.current = setTimeout(() => {
      setAction("add");
    }, INITIAL_HOLD_DELAY_MS);
  };

  const handleRemoveAction = (e: MouseEvent | React.TouchEvent) => {
    if (z.userID === "anon" && "shiftKey" in e && !e.shiftKey) {
      alert("You must be logged in to delete. Hold shift to try anyway.");
      return;
    }
    deleteRandomMessage();

    holdTimerRef.current = setTimeout(() => {
      setAction("remove");
    }, INITIAL_HOLD_DELAY_MS);
  };

  const stopAction = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    setAction(undefined);
  };

  const editMessage = (
    e: MouseEvent,
    id: string,
    senderID: string,
    prev: string
  ) => {
    if (senderID !== z.userID && !e.shiftKey) {
      alert(
        "You aren't logged in as the sender of this message. Editing won't be permitted. Hold the shift key to try anyway."
      );
      return;
    }
    const body = prompt("Edit message", prev);
    z.mutate.messages.update({
      id,
      body: body ?? prev,
    });
  };

  const toggleLogin = async () => {
    if (z.userID === "anon") {
      await fetch("/api/login");
    } else {
      Cookies.remove("jwt");
    }
    location.reload();
  };

  const inspect = async () => {
    alert("Open dev tools console tab to view inspector output.");
    const inspector = await z.inspect();
    const client = inspector.client;

    const style =
      "background-color: darkblue; color: white; font-style: italic; font-size: 2em;";
    console.log("%cPrinting inspector output...", style);
    console.log(
      "%cTo see pretty tables, leave devtools open, then press 'Inspect' button in main UI again.",
      style
    );
    console.log(
      "%cSorry this is so ghetto I was too tired to make a debug dialog.",
      style
    );

    console.log("client:");
    console.log(client);
    console.log("client group:");
    console.log(client.clientGroup);
    console.log("client map:");
    console.log(await client.map());
    for (const tableName of Object.keys(schema.tables)) {
      console.log(`table ${tableName}:`);
      console.table(await client.rows(tableName));
    }
    console.log("client queries:");
    console.table(await client.queries());
    console.log("client group queries:");
    console.table(await client.clientGroup.queries());
    console.log("all clients in group");
    console.table(await client.clientGroup.clients());
  };

  // If initial sync hasn't completed, these can be empty.
  if (!users.length || !mediums.length) {
    return null;
  }

  const user = users.find((user) => user.id === z.userID)?.name ?? "anon";

  return (
    <>
      <div className="controls">
        <div>
          <button
            onMouseDown={handleAddAction}
            onMouseUp={stopAction}
            onMouseLeave={stopAction}
            onTouchStart={handleAddAction}
            onTouchEnd={stopAction}
          >
            Add Messages
          </button>
          <button
            onMouseDown={handleRemoveAction}
            onMouseUp={stopAction}
            onMouseLeave={stopAction}
            onTouchStart={handleRemoveAction}
            onTouchEnd={stopAction}
          >
            Remove Messages
          </button>
          <em>(hold down buttons to repeat)</em>
        </div>
        <div
          style={{
            justifyContent: "end",
          }}
        >
          {user === "anon" ? "" : `Logged in as ${user}`}
          <button onMouseDown={() => toggleLogin()}>
            {user === "anon" ? "Login" : "Logout"}
          </button>
          <button onMouseDown={() => inspect()}>Inspect</button>
        </div>
      </div>
      <div className="controls">
        <div>
          From:
          <select
            onChange={(e) => setFilterUser(e.target.value)}
            style={{ flex: 1 }}
          >
            <option key={""} value="">
              Sender
            </option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          Contains:
          <input
            type="text"
            placeholder="message"
            onChange={(e) => setFilterText(e.target.value)}
            style={{ flex: 1 }}
          />
        </div>
      </div>
      <div className="controls">
        <em>
          {!hasFilters ? (
            <>Showing all {filteredMessages.length} messages</>
          ) : (
            <>
              Showing {filteredMessages.length} of {allMessages.length}{" "}
              messages. Try opening{" "}
              <a href="/" target="_blank">
                another tab
              </a>{" "}
              to see them all!
            </>
          )}
        </em>
      </div>
      {filteredMessages.length === 0 ? (
        <h3>
          <em>No posts found 😢</em>
        </h3>
      ) : (
        <table border={1} cellSpacing={0} cellPadding={6} width="100%">
          <thead>
            <tr>
              <th>Sender</th>
              <th>Medium</th>
              <th>Message</th>
              <th>Sent</th>
              <th>Edit</th>
            </tr>
          </thead>
          <tbody>
            {filteredMessages.map((message) => (
              <tr key={message.id}>
                <td align="left">{message.sender?.name}</td>
                <td align="left">{message.medium?.name}</td>
                <td align="left">{message.body}</td>
                <td align="right">{formatDate(message.timestamp)}</td>
                <td
                  onMouseDown={(e) => {
                    if (message.senderId) {
                      editMessage(
                        e,
                        message.id,
                        message.senderId,
                        message.body
                      );
                    }
                  }}
                >
                  ✏️
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

export default App;
