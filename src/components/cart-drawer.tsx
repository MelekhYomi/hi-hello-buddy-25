import { Link } from "@tanstack/react-router";
import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart, formatNaira } from "@/lib/cart-context";

export function CartDrawer() {
  const { items, isOpen, setOpen, remove, setQty, subtotal, count } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-border bg-background shadow-2xl">
        <header className="flex items-center justify-between border-b border-border/40 px-6 py-5">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-imperium" />
            <h3 className="font-display text-lg uppercase tracking-wider">Your cart ({count})</h3>
          </div>
          <button onClick={() => setOpen(false)} aria-label="Close cart" className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
              <ShoppingBag className="h-12 w-12 opacity-30" />
              <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.25em]">Your cart is empty</p>
              <Link to="/shop" onClick={() => setOpen(false)} className="btn-cta mt-6 h-10 px-6">
                Browse shop
              </Link>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={item.id} className="flex gap-3 border-b border-border/30 pb-4 last:border-b-0">
                  {item.image && (
                    <img src={item.image} alt={item.title} className="h-20 w-20 shrink-0 rounded-md object-cover" />
                  )}
                  <div className="flex flex-1 flex-col">
                    <div className="text-sm font-medium leading-tight">{item.title}</div>
                    <div className="mt-1 text-xs text-imperium">{formatNaira(item.price)}</div>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center rounded-md border border-border">
                        <button onClick={() => setQty(item.id, item.quantity - 1)} className="p-1.5 hover:text-imperium" aria-label="Decrease">
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="px-3 font-mono text-xs">{item.quantity}</span>
                        <button onClick={() => setQty(item.id, item.quantity + 1)} className="p-1.5 hover:text-imperium" aria-label="Increase">
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <button onClick={() => remove(item.id)} className="text-muted-foreground hover:text-destructive" aria-label="Remove">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <footer className="border-t border-border/40 px-6 py-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Subtotal</span>
              <span className="font-display text-2xl text-imperium">{formatNaira(subtotal)}</span>
            </div>
            <p className="text-[11px] text-muted-foreground">Shipping calculated at checkout.</p>
            <Link to="/checkout" onClick={() => setOpen(false)} className="btn-cta h-12 w-full">
              Checkout →
            </Link>
            <Link to="/shop" onClick={() => setOpen(false)} className="block text-center font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground">
              Continue shopping
            </Link>
          </footer>
        )}
      </aside>
    </div>
  );
}
