**Duration:** ~5 min

**Talking points**
- Walk left-to-right on the diagram slowly.
- UART at 921600 is the production path; Simulator injects the same broker topic without opening COM.
- The serial bridge is a separate Node process (`npm run start:bridge`) — webviews are clients.
- Presentation slides subscribe to `useBitstreamLiveStore`, not a second WebSocket in the deck.

**Demo script**
- Point at the architecture slide, then jump ahead to **Live broker status** demo after explaining the path.

**Q&A prompts**
- Where does decode happen on the host?
- Can multiple webviews connect at once?
