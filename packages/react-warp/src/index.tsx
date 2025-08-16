import { type Atom, atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import type { ReactNode } from "react";

interface PopupState<TContext, TOptions> {
  key: number;
  data: Atom<{ context: TContext; node: ReactNode }>;
  options: TOptions;
  isOpen: boolean;
  onClose: (value: null) => void;
}

export interface Popup<TContext, TOptions> {
  isOpen: boolean;
  close: () => void;
  context: TContext;
  options: TOptions;
  children: ReactNode;
}

export interface PopupHostOptions<TContext, TOptions> {
  renderPopup: (props: Popup<TContext, TOptions>) => ReactNode;
  useContext: () => TContext;
  /**
   * The amount of time, in milliseconds, after which the popup will be deleted after being closed.
   * Defaults to 5 seconds to allow closing animations to finish.
   * @default 5000
   */
  deleteAfter?: number;
}

function PopupRenderer<TContext, TOptions>({
  popup,
  closePopup,
  render: Render,
}: {
  popup: PopupState<TContext, TOptions>;
  closePopup: () => void;
  render: (props: Popup<TContext, TOptions>) => ReactNode;
}) {
  const data = useAtomValue(popup.data);
  return (
    <Render
      isOpen={popup.isOpen}
      close={closePopup}
      context={data.context}
      options={popup.options}
    >
      {data.node}
    </Render>
  );
}

export interface PopupHost<TOptions> {
  PopupHost: () => ReactNode;
  usePopup: () => <TReturn = void>(
    node: (onClose: (value: TReturn | null) => void) => ReactNode,
    options: TOptions,
  ) => Promise<TReturn | null>;
}

export function createPopupHost<TContext, TOptions>(
  options: PopupHostOptions<TContext, TOptions>,
): PopupHost<TOptions> {
  let popupIndex = 0;
  const popupsAtom = atom<PopupState<TContext, TOptions>[]>([]);
  return {
    PopupHost: () => {
      const [popups, setPopups] = useAtom(popupsAtom);
      return (
        <>
          {popups.map((popup) => (
            <PopupRenderer
              key={popup.key}
              render={options.renderPopup}
              popup={popup}
              closePopup={() => {
                popup.onClose(null);
                setPopups((popups) =>
                  popups.map((p) =>
                    p.key === popup.key ? { ...p, isOpen: false } : p,
                  ),
                );
                setTimeout(() => {
                  setPopups((popups) =>
                    popups.filter((p) => p.key !== popup.key),
                  );
                }, options.deleteAfter ?? 5000);
              }}
            />
          ))}
        </>
      );
    },
    usePopup: () => {
      const context = options.useContext();
      const setPopups = useSetAtom(popupsAtom);
      return <TReturn = void>(
        getNode: (onClose: (value: TReturn | null) => void) => ReactNode,
        popupOptions: TOptions,
      ) => {
        const key = popupIndex++;
        return new Promise<TReturn | null>((resolve) => {
          const close = (value: TReturn | null) => {
            resolve(value);
            setPopups((popups) =>
              popups.map((p) => (p.key === key ? { ...p, isOpen: false } : p)),
            );
            setTimeout(() => {
              setPopups((popups) => popups.filter((p) => p.key !== key));
            }, options.deleteAfter ?? 5000);
          };
          setPopups((popups) => {
            return [
              ...popups,
              {
                key,
                data: atom({ context, node: getNode(close) }),
                options: popupOptions,
                onClose: resolve,
                isOpen: true,
              },
            ];
          });
        });
      };
    },
  };
}
