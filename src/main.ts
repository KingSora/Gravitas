import { AnimationController } from "./animation/animation-controller";
import { type AnimationProgress } from "./animation/animation-loop";
import { SpringAnimation } from "./animation/spring-animation";
import { SpringAnimationDescription } from "./animation/spring-animation-description";
import "./style.css";

const dot = document.getElementById("dot")!;
const btn = document.getElementById("btn")!;

const description = SpringAnimationDescription.physical(1, 3, 50);
const controllerX = new AnimationController();
const controllerY = new AnimationController();

document.addEventListener("mousemove", (e) => {
  const { clientX, clientY } = e;
  const onFrameX = ({ position }: AnimationProgress) => {
    dot.style.setProperty("--x", `${position}px`);
  };
  const onFrameY = ({ position }: AnimationProgress) => {
    dot.style.setProperty("--y", `${position}px`);
  };

  controllerX
    .animate((state) => {
      return {
        animation: new SpringAnimation(
          description,
          state?.position || parseFloat(dot.style.getPropertyValue("--x")) || 0,
          clientX,
          state?.velocity || 0,
        ),
        options: {
          progress: state,
          onFrame: onFrameX,
        },
      };
    })
    .then((animateResult) => {
      if (animateResult.completed) {
        console.log(animateResult);
      }
    });

  controllerY.animate((state) => {
    return {
      animation: new SpringAnimation(
        description,
        state?.position || parseFloat(dot.style.getPropertyValue("--y")) || 0,
        clientY,
        state?.velocity || 0,
      ),
      options: {
        progress: state,
        onFrame: onFrameY,
      },
    };
  });
});

btn.addEventListener("click", () => {});
