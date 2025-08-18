import { expect, test, vi } from "vitest";
import { createPopupHost } from "../src/index.js";
import { useState, type ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

function createApp() {
  const MyAppProvider = ({ children }: { children: ReactNode }) => {
    return <>{children}</>;
  };

  // Based on the example in the docs
  const { PopupHost, usePopup } = createPopupHost<
    // Popup Context
    null,
    // Popup Options
    {
      backdropTestId?: string;
    }
  >({
    renderPopup: (popup) => {
      return (
        <>
          <div
            aria-hidden={!popup.isOpen}
            data-testid={popup.options.backdropTestId}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              pointerEvents: popup.isOpen ? "auto" : "none",
            }}
            onClick={() => popup.close()}
          />
          <div
            aria-hidden={!popup.isOpen}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              opacity: popup.isOpen ? 1 : 0,
              transition: "opacity 0.3s ease-in-out",
              backgroundColor: "white",
              padding: 16,
              borderRadius: 8,
              boxShadow: "0 0 10px 0 rgba(0, 0, 0, 0.1)",
              pointerEvents: popup.isOpen ? "auto" : "none",
            }}
          >
            {popup.children}
          </div>
        </>
      );
    },
    useContext: () => null,
  });

  const MyPopupContent = ({
    onClose,
  }: {
    onClose: (value: string | null) => void;
  }) => {
    const [name, setName] = useState<string>("");
    return (
      <div>
        <h1>My Amazing Popup</h1>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button onClick={() => onClose(null)}>Cancel</button>
        <button onClick={() => onClose(name)}>Submit</button>
      </div>
    );
  };

  const MyAppContent = () => {
    const openPopup = usePopup();

    return (
      <div>
        <h1>My Amazing App</h1>
        <button
          onClick={async () => {
            const name = await openPopup<string>(
              (onClose) => <MyPopupContent onClose={onClose} />,
              { backdropTestId: "popup-overlay" }
            );
            if (name === null) {
              console.info("Popup closed.");
              return;
            }
            console.info(`Hello, ${name}!`);
          }}
        >
          Enter name
        </button>
        <button
          onClick={() => void openPopup(() => <h1>Another Popup</h1>, {})}
        >
          Enter popup 2
        </button>
      </div>
    );
  };

  return () => {
    return (
      <MyAppProvider>
        <MyAppContent />
        <PopupHost />
      </MyAppProvider>
    );
  };
}

test("Popup Host - Open and Close with Button", async () => {
  const App = createApp();

  const { unmount } = render(<App />);
  vi.useFakeTimers({
    toFake: ["setTimeout"],
    shouldAdvanceTime: true,
  });

  // Open the "My Amazing Popup" popup
  await userEvent.click(screen.getByRole("button", { name: "Enter name" }));

  // Expect the popup to be visible
  expect(screen.getByText("My Amazing Popup")).toBeVisible();

  // Click the submit button
  await userEvent.click(screen.getByRole("button", { name: "Submit" }));

  // Expect the popup to be hidden, but still in the DOM
  expect(screen.getByText("My Amazing Popup")).not.toBeVisible();
  expect(screen.getByText("My Amazing Popup")).toBeInTheDocument();

  // Wait 5 seconds
  await vi.advanceTimersByTimeAsync(5000);

  // Expect the popup to be hidden
  await waitFor(
    () => {
      expect(screen.queryByText("My Amazing Popup")).not.toBeInTheDocument();
    },
    { timeout: 1 }
  );

  unmount();
}, 10_000);

test("Popup Host - Open and Close with Backdrop", async () => {
  const App = createApp();

  const { unmount } = render(<App />);
  vi.useFakeTimers({
    toFake: ["setTimeout"],
    shouldAdvanceTime: true,
  });

  // Open the "My Amazing Popup" popup
  await userEvent.click(screen.getByRole("button", { name: "Enter name" }));

  // Expect the popup to be visible
  expect(screen.getByText("My Amazing Popup")).toBeVisible();

  // Click the backdrop
  await userEvent.click(screen.getByTestId("popup-overlay"));

  // Expect the popup to be hidden, but still in the DOM
  expect(screen.getByText("My Amazing Popup")).not.toBeVisible();
  expect(screen.getByText("My Amazing Popup")).toBeInTheDocument();

  // Wait 5 seconds
  await vi.advanceTimersByTimeAsync(5000);

  // Expect the popup to be hidden
  await waitFor(
    () => {
      expect(screen.queryByText("My Amazing Popup")).not.toBeInTheDocument();
    },
    { timeout: 1 }
  );

  unmount();
}, 10_000);

test("Popup Host - Open Multiple at Once and Close with Button", async () => {
  const App = createApp();

  const { unmount } = render(<App />);
  vi.useFakeTimers({
    toFake: ["setTimeout"],
    shouldAdvanceTime: true,
  });

  // Open the "My Amazing Popup" popup
  await userEvent.click(screen.getByRole("button", { name: "Enter name" }));

  // Expect the popup to be visible
  expect(screen.getByText("My Amazing Popup")).toBeVisible();

  // Open the "Another Popup" popup
  await userEvent.click(screen.getByRole("button", { name: "Enter popup 2" }));

  // Expect the "Another Popup" popup to be visible
  expect(screen.getByText("Another Popup")).toBeVisible();

  // Click the submit button
  await userEvent.click(screen.getByRole("button", { name: "Submit" }));

  // Expect the popup to be hidden, but still in the DOM
  expect(screen.getByText("My Amazing Popup")).not.toBeVisible();
  expect(screen.getByText("My Amazing Popup")).toBeInTheDocument();

  // Expect the "Another Popup" popup to still be visible
  expect(screen.getByText("Another Popup")).toBeVisible();

  // Wait 5 seconds
  await vi.advanceTimersByTimeAsync(5000);

  // Expect the popup to be hidden
  await waitFor(
    () => {
      expect(screen.queryByText("My Amazing Popup")).not.toBeInTheDocument();
    },
    { timeout: 1 }
  );

  // Expect the "Another Popup" popup to still be visible
  expect(screen.getByText("Another Popup")).toBeVisible();

  unmount();
}, 10_000);

test("Popup Host - Open Multiple at Once and Close with Backdrop", async () => {
  const App = createApp();

  const { unmount } = render(<App />);
  vi.useFakeTimers({
    toFake: ["setTimeout"],
    shouldAdvanceTime: true,
  });

  // Open the "My Amazing Popup" popup
  await userEvent.click(screen.getByRole("button", { name: "Enter name" }));

  // Expect the popup to be visible
  expect(screen.getByText("My Amazing Popup")).toBeVisible();

  // Open the "Another Popup" popup
  await userEvent.click(screen.getByRole("button", { name: "Enter popup 2" }));

  // Expect the "Another Popup" popup to be visible
  expect(screen.getByText("Another Popup")).toBeVisible();

  // Click the backdrop
  await userEvent.click(screen.getByTestId("popup-overlay"));

  // Expect the popup to be hidden, but still in the DOM
  expect(screen.getByText("My Amazing Popup")).not.toBeVisible();
  expect(screen.getByText("My Amazing Popup")).toBeInTheDocument();

  // Expect the "Another Popup" popup to still be visible
  expect(screen.getByText("Another Popup")).toBeVisible();

  // Wait 5 seconds
  await vi.advanceTimersByTimeAsync(5000);

  // Expect the popup to be hidden
  await waitFor(
    () => {
      expect(screen.queryByText("My Amazing Popup")).not.toBeInTheDocument();
    },
    { timeout: 1 }
  );

  // Expect the "Another Popup" popup to still be visible
  expect(screen.getByText("Another Popup")).toBeVisible();

  unmount();
}, 10_000);
