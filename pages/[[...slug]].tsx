import React from "react";
import NextLink from "next/link";
import SelectionArea, { SelectionEvent } from "@viselect/react";
import { useRouter } from "next/router";
import copy from "copy-to-clipboard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "../components/Dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../components/DropdownMenu";
import { Toast, ToastTitle } from "../components/Toast";
import { ScrollArea } from "../components/ScrollArea";
import { Button } from "../components/Button";
import { ButtonGroup } from "../components/ButtonGroup";
import * as Collapsible from "@radix-ui/react-collapsible";
import { isTouchDevice } from "../utils/isTouchDevice";

import { categories, Category, Preset } from "../data/presets";

import styles from "../styles/Home.module.css";
import { Instructions } from "../components/Instructions";
import { useSectionInView } from "../utils/useSectionInViewObserver";
import { extractPresets } from "../utils/extractPresets";
import CreativityIcon from "../components/CreativityIcon";
import {
  ChevronDownIcon,
  CopyClipboardIcon,
  DownloadIcon,
  LinkIcon,
  PlusCircleIcon,
  RaycastLogoNegIcon,
  StarsIcon,
  TrashIcon,
} from "@raycast/icons";
import {
  addToRaycast,
  copyData,
  downloadData,
  makeUrl,
} from "../utils/actions";
import WebSearchIcon from "../components/WebSearchIcon";

const aiModel = {
  openai_davinci_003: ["Davinci", "Davinci-3"],
  openai_gpt35_turbo: ["GPT-3.5", "Open AI GPT-3.5 Turbo"],
  openai_gpt4: ["GPT-4", "Open AI GPT-4"],
  openai_gpt4_turbo: ["GPT-4-Turbo", "Open AI GPT-4 Turbo"],
  anthropic_claude: ["Claude", "Antrophic Claude"],
};

export function getStaticPaths() {
  const paths = categories.map((category) => ({
    params: { slug: [category.slug.replace("/", "")] },
  }));

  return {
    paths: [
      ...paths,
      {
        params: { slug: [] },
      },
    ],
    fallback: false,
  };
}

export async function getStaticProps() {
  return {
    props: {},
  };
}

export default function Home({ onTouchReady }: { onTouchReady: () => void }) {
  const router = useRouter();

  const [selectedPresets, setSelectedPresets] = React.useState<Preset[]>([]);

  const [showToast, setShowToast] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState("");

  const [actionsOpen, setActionsOpen] = React.useState(false);
  const [aboutOpen, setAboutOpen] = React.useState(false);
  const [isTouch, setIsTouch] = React.useState<boolean>();

  const onStart = ({ event, selection }: SelectionEvent) => {
    if (!isTouch && !event?.ctrlKey && !event?.metaKey) {
      selection.clearSelection();
      setSelectedPresets([]);
    }
  };

  const onMove = ({
    store: {
      changed: { added, removed },
    },
  }: SelectionEvent) => {
    const addedPresets = extractPresets(added, categories);
    const removedPresets = extractPresets(removed, categories);

    setSelectedPresets((prevPresets) => {
      const presets = [...prevPresets];

      addedPresets.forEach((preset) => {
        if (!preset) {
          return;
        }
        if (presets.find((p) => p.id === preset.id)) {
          return;
        }
        presets.push(preset);
      });

      removedPresets.forEach((preset) => {
        return presets.filter((s) => s?.id !== preset?.id);
      });

      return presets;
    });
  };

  const handleDownload = React.useCallback(() => {
    downloadData(selectedPresets);
  }, [selectedPresets]);

  const handleCopyData = React.useCallback(() => {
    copyData(selectedPresets);
    setToastMessage("Copied to clipboard");
    setShowToast(true);
  }, [selectedPresets]);

  const handleCopyUrl = React.useCallback(async () => {
    setToastMessage("Copying URL to clipboard...");
    setShowToast(true);

    const url = makeUrl(selectedPresets);
    let urlToCopy = url;
    const encodedUrl = encodeURIComponent(urlToCopy);
    const response = await fetch(
      `https://ray.so/api/shorten-url?url=${encodedUrl}&ref=presets`
    ).then((res) => res.json());

    if (response.link) {
      urlToCopy = response.link;
    }

    copy(urlToCopy);
    setShowToast(true);
    setToastMessage("Copied URL to clipboard!");
  }, [selectedPresets]);

  const handleAddToRaycast = React.useCallback(
    () => addToRaycast(router, selectedPresets),
    [router, selectedPresets]
  );

  React.useEffect(() => {
    setIsTouch(isTouchDevice());
    onTouchReady();
  }, [isTouch, setIsTouch, onTouchReady]);

  React.useEffect(() => {
    const down = (event: KeyboardEvent) => {
      const { key, keyCode, metaKey, shiftKey, altKey } = event;

      if (key === "k" && metaKey) {
        if (selectedPresets.length === 0) return;
        setActionsOpen((prevOpen) => {
          return !prevOpen;
        });
      }

      if (key === "d" && metaKey) {
        if (selectedPresets.length === 0) return;
        event.preventDefault();
        handleDownload();
      }

      if (key === "Enter" && metaKey) {
        if (selectedPresets.length === 0) return;
        event.preventDefault();
        handleAddToRaycast();
      }

      // key === "c" doesn't work when using alt key, so we use keCode instead (67)
      if (keyCode === 67 && metaKey && altKey) {
        if (selectedPresets.length === 0) return;
        event.preventDefault();
        handleCopyData();
        setActionsOpen(false);
      }

      if (key === "c" && metaKey && shiftKey) {
        event.preventDefault();
        handleCopyUrl();
        setActionsOpen(false);
      }

      if (key === "," && metaKey && shiftKey) {
        event.preventDefault();
        setActionsOpen(false);
        setAboutOpen(false);
      }

      if (key === "/" && metaKey) {
        event.preventDefault();
        setActionsOpen(false);
        setAboutOpen((prevOpen) => !prevOpen);
      }

      if (key === "a" && metaKey) {
        event.preventDefault();
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [
    setActionsOpen,
    setAboutOpen,
    selectedPresets,
    handleCopyData,
    handleDownload,
    handleCopyUrl,
    handleAddToRaycast,
  ]);

  React.useEffect(() => {
    if (showToast) {
      setTimeout(() => {
        setShowToast(false);
      }, 2000);
    }
  }, [showToast]);

  return (
    <div>
      <header className={styles.nav}>
        <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
          <DialogTrigger asChild>
            <button className={styles.logo}>
              <RaycastLogoNegIcon />
              <div className={styles.logoSeparator} aria-hidden="true"></div>
              <h2>Preset Explorer</h2>
            </button>
          </DialogTrigger>
          <DialogContent className={styles.about} showCloseButton={true}>
            <div className={styles.aboutTopContent}>
              <div>
                <DialogTitle className={styles.dialogTitle}>About</DialogTitle>
                <DialogDescription className={styles.dialogDescription}>
                  Preset Explorer is a tool to easily browse, share, and add
                  presets to <a href="https://raycast.com">Raycast</a>.
                </DialogDescription>
                <p className={styles.dialogDescription}>
                  Select the presets by clicking on them. To select multiple,
                  hold <kbd>⌘</kbd> or select them with your mouse.
                </p>
                <p className={styles.dialogDescription}>
                  Then, click the “Add to Raycast” button to import these AI
                  presets. You can also download the presets as a JSON file, or
                  copy the URL to share with others.
                </p>
              </div>
              {!isTouch && (
                <div>
                  <h4 className={styles.dialogTitle}>Shortcuts</h4>
                  <ul className={styles.shortcuts}>
                    <li>
                      Add to Raycast
                      <span className={styles.hotkeys}>
                        <kbd>⌘</kbd>
                        <kbd>⏎</kbd>
                      </span>
                    </li>
                    <li>
                      Toggle Export Menu
                      <span className={styles.hotkeys}>
                        <kbd>⌘</kbd>
                        <kbd>K</kbd>
                      </span>
                    </li>
                    <li>
                      Configure Hotkeys
                      <span className={styles.hotkeys}>
                        <kbd>⌘</kbd>
                        <kbd>⇧</kbd>
                        <kbd>,</kbd>
                      </span>
                    </li>
                    <li>
                      Download JSON
                      <span className={styles.hotkeys}>
                        <kbd>⌘</kbd>
                        <kbd>D</kbd>
                      </span>
                    </li>
                    <li>
                      Copy JSON
                      <span className={styles.hotkeys}>
                        <kbd>⌘</kbd>
                        <kbd>⌥</kbd>
                        <kbd>C</kbd>
                      </span>
                    </li>
                    <li>
                      Copy URL to Share
                      <span className={styles.hotkeys}>
                        <kbd>⌘</kbd>
                        <kbd>⇧</kbd>
                        <kbd>C</kbd>
                      </span>
                    </li>
                    <li>
                      Toggle this view
                      <span className={styles.hotkeys}>
                        <kbd>⌘</kbd>
                        <kbd>/</kbd>
                      </span>
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <h4 className={styles.dialogTitle}>Contribute</h4>
            <p className={styles.dialogDescription}>
              This project is Open Source and{" "}
              <a
                href="https://github.com/raycast/preset-explorer"
                title="Preset Explorer on GitHub"
              >
                available on GitHub
              </a>
              . We welcome contributions!
              <br />
              If you have any questions or feedback, please{" "}
              <a href="mailto:feedback+rayso@raycast.com?subject=presets">
                send us an email
              </a>
              .
            </p>

            <p style={{ fontSize: 13, marginTop: 32 }}>
              <a
                href="https://raycast.com"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                Made by{" "}
                <span style={{ color: "#FF6363" }}>
                  <RaycastLogoNegIcon />{" "}
                </span>
                <span>Raycast</span>
              </a>
            </p>
            <div className={styles.aboutGlow} />
          </DialogContent>
        </Dialog>

        <div className={styles.navControls}>
          {!isTouch ? (
            <ButtonGroup>
              <Button
                variant="red"
                disabled={selectedPresets.length === 0}
                onClick={() => handleAddToRaycast()}
              >
                <PlusCircleIcon /> Add to Raycast
              </Button>

              <DropdownMenu open={actionsOpen} onOpenChange={setActionsOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="red"
                    disabled={selectedPresets.length === 0}
                    aria-label="Export options"
                  >
                    <ChevronDownIcon />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    disabled={selectedPresets.length === 0}
                    onSelect={() => handleDownload()}
                  >
                    <DownloadIcon /> Download JSON
                    <span className={styles.hotkeys}>
                      <kbd>⌘</kbd>
                      <kbd>D</kbd>
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={selectedPresets.length === 0}
                    onSelect={() => handleCopyData()}
                  >
                    <CopyClipboardIcon /> Copy JSON{" "}
                    <span className={styles.hotkeys}>
                      <kbd>⌘</kbd>
                      <kbd>⌥</kbd>
                      <kbd>C</kbd>
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={selectedPresets.length === 0}
                    onSelect={() => handleCopyUrl()}
                  >
                    <LinkIcon /> Copy URL to Share{" "}
                    <span className={styles.hotkeys}>
                      <kbd>⌘</kbd>
                      <kbd>⇧</kbd>
                      <kbd>C</kbd>
                    </span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                </DropdownMenuContent>
              </DropdownMenu>
            </ButtonGroup>
          ) : (
            <Button
              variant="red"
              disabled={selectedPresets.length === 0}
              onClick={() => handleCopyUrl()}
            >
              <LinkIcon /> Copy URL to Share
            </Button>
          )}
        </div>
      </header>

      <Toast open={showToast} onOpenChange={setShowToast}>
        <ToastTitle className={styles.toastTitle}>
          <CopyClipboardIcon /> {toastMessage}
        </ToastTitle>
      </Toast>

      <div className={styles.main}>
        <div className={styles.sidebar}>
          <div className={styles.sidebarInner}>
            <ScrollArea>
              <div className={styles.sidebarContent}>
                <div className={styles.sidebarNav}>
                  <p className={styles.sidebarTitle}>Categories</p>

                  {categories.map((category) => (
                    <NavItem key={category.slug} category={category} />
                  ))}
                </div>

                {selectedPresets.length === 0 && <Instructions />}

                {selectedPresets.length > 0 && (
                  <div>
                    <p className={styles.sidebarTitle}>Add to Raycast</p>

                    <Collapsible.Root>
                      <Collapsible.Trigger asChild>
                        <button className={styles.summaryTrigger}>
                          {selectedPresets.length}{" "}
                          {selectedPresets.length > 1 ? "Presets" : "Preset"}{" "}
                          selected
                          <ChevronDownIcon />
                        </button>
                      </Collapsible.Trigger>

                      <Collapsible.Content className={styles.summaryContent}>
                        {selectedPresets.map((preset, index) => (
                          <div
                            key={preset.title + index}
                            className={styles.summaryItem}
                          >
                            {preset.title}
                            <button
                              className={styles.summaryItemButton}
                              onClick={() => {
                                setSelectedPresets(
                                  selectedPresets.filter(
                                    (selectedPreset) =>
                                      selectedPreset.id !== preset.id
                                  )
                                );
                              }}
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        ))}
                      </Collapsible.Content>
                    </Collapsible.Root>

                    <div className={styles.summaryControls}>
                      <Button onClick={handleAddToRaycast} variant="red">
                        Add to Raycast
                      </Button>

                      <Button onClick={() => setSelectedPresets([])}>
                        Clear selected
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <div className={styles.container}>
          {isTouch !== null && (
            <SelectionArea
              className="container"
              onStart={onStart}
              onMove={onMove}
              selectables=".selectable"
              features={{
                // Disable support for touch devices
                touch: isTouch ? false : true,
                range: true,
                singleTap: {
                  allow: true,
                  intersect: "native",
                },
              }}
            >
              {categories.map((category) => {
                return (
                  <div
                    key={category.name}
                    data-section-slug={category.slug}
                    style={{
                      outline: "none",
                    }}
                    tabIndex={-1}
                  >
                    <h2 className={styles.subtitle}>
                      <category.iconComponent /> {category.name}
                    </h2>
                    <div className={styles.presets}>
                      {category.presets.map((preset, index) => {
                        return (
                          <div
                            className={`${styles.item} selectable`}
                            key={preset.id}
                            data-selected={selectedPresets.some(
                              (selectedPreset) =>
                                selectedPreset.id === preset.id
                            )}
                            data-key={`${category.slug}-${index}`}
                          >
                            <div className={styles.presetTemplate}>
                              <ScrollArea>
                                <pre
                                  className={styles.template}
                                  dangerouslySetInnerHTML={{
                                    __html: preset.instructions.replace(
                                      /\{[^}]+\}/g,
                                      `<span class="${styles.placeholder}">$&</span>`
                                    ),
                                  }}
                                ></pre>
                              </ScrollArea>
                            </div>
                            <div className={styles.preset}>
                              <span className={styles.name}>
                                <preset.iconComponent />
                                {preset.title}
                                {preset.author ? (
                                  <span className={styles.presetAuthor}>
                                    by{" "}
                                    {preset.author.link ? (
                                      <a
                                        href={preset.author.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        {preset.author.name}
                                      </a>
                                    ) : (
                                      preset.author.name
                                    )}
                                  </span>
                                ) : null}
                              </span>
                              {preset.model ? (
                                <span
                                  className={styles.presetModel}
                                  title={aiModel[preset.model][1]}
                                >
                                  {aiModel[preset.model][0]}
                                </span>
                              ) : null}
                              <WebSearchIcon webSearch={preset.web_search} />
                              <CreativityIcon creativity={preset.creativity} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </SelectionArea>
          )}
        </div>
      </div>
    </div>
  );
}

function NavItem({ category }: { category: Category }) {
  const activeSection = useSectionInView();

  return (
    <NextLink
      href={category.slug}
      shallow
      className={styles.sidebarNavItem}
      data-active={activeSection === category.slug}
    >
      {category.icon ? <category.iconComponent /> : <StarsIcon />}

      {category.name}
      <span className={styles.badge}>{category.presets.length}</span>
    </NextLink>
  );
}
