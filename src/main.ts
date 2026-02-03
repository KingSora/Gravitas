import { AnimationController } from "./animation/animation-controller";
import type { AnimationProgress } from "./animation/animation-loop";
import { EasingAnimation } from "./animation/easing-animation.ts/easign-animation";
import { EasignDescription } from "./animation/easing-animation.ts/easing-description";
import { GravityAnimation } from "./animation/gravity/gravity-animation";
import { SpringAnimation } from "./animation/spring/spring-animation";
import { SpringDescription } from "./animation/spring/spring-description";
import "./style.css";
import { AnimationPreview } from "./preview";
import { springValue } from "motion";

const description = SpringDescription.physical({
  mass: 1,
  damping: 10,
  stiffness: 100,
});
const s = springValue<number>(0.5, { mass: 1, damping: 10, stiffness: 100 });

window.addEventListener("load", () => {
  let me = 0.5;

  const controller = new AnimationController();
  const preview = new AnimationPreview({
    lines: [
      {
        id: "motion",
        color: "red",
        strength: 2,
      },
      {
        id: "me",
        color: "green",
        strength: 2,
      },
    ],
    onLineValue(lineId: string) {
      if (lineId === "motion") {
        // return s.get();
      }
      if (lineId === "me") {
        return me;
      }
      return 0;
    },
    onTargetChange(from, to) {
      const motion = s.get();
      s.set(to);

      controller.animate((state) => {
        const my = state?.position || from || 0;
        // console.log({ motion, my });
        return {
          animation: new SpringAnimation(
            {
              from: state?.position || from || 0,
              to,
              velocity: state?.velocity,
            },
            description,
          ),
          options: {
            progress: state,
            onStart: (s) => {
              console.log("start my", s.position, performance.now());
            },
            onFrame: ({ position }: AnimationProgress) => {
              me = position;
            },
          },
        };
      });
    },
  });

  s.on("animationStart", () => {
    //console.log("start mo", s.get(), performance.now());
  });
});

//const dot = document.getElementById("dot")!;
//const btn = document.getElementById("btn")!;
//
//const description = SpringDescription.physical(1, 10, 100);
//const controllerX = new AnimationController();
//const controllerY = new AnimationController();
//
//document.addEventListener("mousemove", (e) => {
//  const { clientX, clientY } = e;
//  const onFrameX = ({ position }: AnimationProgress) => {
//    dot.style.setProperty("--x", `${position}px`);
//  };
//  const onFrameY = ({ position }: AnimationProgress) => {
//    dot.style.setProperty("--y", `${position}px`);
//  };
//
//  controllerX
//    .animate((state) => {
//      return {
//        animation: new EasingAnimation(
//          {
//            from:
//              state?.position ||
//              parseFloat(dot.style.getPropertyValue("--x")) ||
//              0,
//            to: clientX,
//            velocity: state?.velocity,
//          },
//          new EasignDescription(
//            (x: number) => -(Math.cos(Math.PI * x) - 1) / 2,
//            (x: number) => (Math.PI / 2) * Math.sin(Math.PI * x),
//          ),
//          1000,
//        ),
//        options: {
//          progress: state,
//          onFrame: onFrameX,
//        },
//      };
//    })
//    .then((animateResult) => {
//      if (animateResult.completed) {
//        console.log(animateResult);
//      }
//    });
//  /*
//  controllerY
//    .animate((state) => {
//      return {
//        animation: new EasingAnimation(
//          {
//            from:
//              state?.position ||
//              parseFloat(dot.style.getPropertyValue("--y")) ||
//              0,
//            to: clientY,
//            velocity: state?.velocity,
//          },
//          new EasignDescription(
//            (x: number) => -(Math.cos(Math.PI * x) - 1) / 2,
//            (x: number) => (Math.PI / 2) * Math.sin(Math.PI * x),
//          ),
//          300,
//        ),
//        options: {
//          progress: state,
//          onFrame: onFrameY,
//        },
//      };
//    })
//    .then((animateResult) => {
//      if (animateResult.completed) {
//        console.log(animateResult);
//      }
//    });
//    */
//  /*
//  controllerX
//    .animate((state) => {
//      return {
//        animation: new SpringAnimation(
//        {
//          from:
//            state?.position ||
//            parseFloat(dot.style.getPropertyValue("--x")) ||
//            0,
//          to: clientX,
//          velocity: state?.velocity,
//          },
//          description,
//        ),
//        options: {
//          progress: state,
//          onFrame: onFrameX,
//        },
//      };
//    })
//    .then((animateResult) => {
//      if (animateResult.completed) {
//        console.log(animateResult);
//      }
//    });
//
//  controllerY.animate((state) => {
//    return {
//      animation: new SpringAnimation(
//      {
//        from:
//          state?.position ||
//          parseFloat(dot.style.getPropertyValue("--y")) ||
//          0,
//        to: clientY,
//        velocity: state?.velocity,
//        },
//        description,
//      ),
//      options: {
//        progress: state,
//        onFrame: onFrameY,
//      },
//    };
//  });
//*/
//  /*
//  controllerX
//    .animate((progress) => {
//      return {
//        animation: new GravityAnimation(
//          {
//            from:
//              progress?.position ||
//              parseFloat(
//                window.getComputedStyle(dot).getPropertyValue("--x"),
//              ) ||
//              0,
//            to: clientX,
//            velocity: progress?.velocity,
//          },
//          9.8 * 150,
//        ),
//        options: {
//          progress: progress,
//          onFrame: onFrameX,
//        },
//      };
//    })
//    .then((animateResult) => {
//
//      if (animateResult.completed) {
//        controllerX.animate({
//          animation: new SpringAnimation(
//            {
//              from: animateResult.progress.position,
//              to: animateResult.progress.position,
//              velocity: animateResult.progress.velocity,
//            },
//            description,
//          ),
//          options: {
//            progress: animateResult.progress,
//            onFrame: onFrameX,
//          },
//        });
//      }
//
//    });
//
//  controllerY
//    .animate((progress) => {
//      return {
//        animation: new GravityAnimation(
//          {
//            from:
//              progress?.position ||
//              parseFloat(
//                window.getComputedStyle(dot).getPropertyValue("--y"),
//              ) ||
//              0,
//            to: clientY,
//            velocity: progress?.velocity,
//          },
//          9.8 * 150,
//        ),
//        options: {
//          progress: progress,
//          onFrame: onFrameY,
//        },
//      };
//    })
//    .then((animateResult) => {
//
//      if (animateResult.completed) {
//        controllerY.animate({
//          animation: new SpringAnimation(
//            {
//              from: animateResult.progress.position,
//              to: animateResult.progress.position,
//              velocity: animateResult.progress.velocity,
//            },
//            description,
//          ),
//          options: {
//            progress: animateResult.progress,
//            onFrame: onFrameY,
//          },
//        });
//      }
//
//    });
//    */
//});
//
//btn.addEventListener("click", () => {});
