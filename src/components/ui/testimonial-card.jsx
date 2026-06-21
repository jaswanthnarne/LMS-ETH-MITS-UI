import * as React from "react"
import { Star } from "lucide-react"
import { cn } from "../../lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "./avatar"

const Testimonial = React.forwardRef(
  ({ name, role, company, testimonial, rating = 5, image, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-2xl border border-borderCool bg-bgSecondary p-4 transition-all hover:shadow-lg md:p-5 text-textPrimary",
          className
        )}
        {...props}
      >
        <div className="absolute right-6 top-6 text-6xl font-serif text-textMuted/15 select-none leading-none">
          "
        </div>

        <div className="flex flex-col gap-4 justify-between h-full relative z-10">
          {rating > 0 && (
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  size={14}
                  className={cn(
                    "stroke-1",
                    index < rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "fill-bgHover text-textMuted/20"
                  )}
                />
              ))}
            </div>
          )}

          <p className="text-pretty text-[13px] leading-relaxed text-textSecondary font-light">
            {testimonial}
          </p>

          <div className="flex items-center gap-4 justify-start pt-2">
            <div className="flex items-center gap-3">
              {image && (
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarImage src={image} alt={name} />
                  <AvatarFallback>{name[0]}</AvatarFallback>
                </Avatar>
              )}

              <div className="flex flex-col min-w-0">
                <h3 className="font-semibold text-xs text-textPrimary truncate">{name}</h3>
                <p className="text-[10px] text-textMuted truncate">
                  {role}
                  {company && ` @ ${company}`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
)
Testimonial.displayName = "Testimonial"

export { Testimonial }
