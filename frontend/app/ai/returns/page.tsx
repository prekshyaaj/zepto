"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Camera, CheckCircle2, Image as ImageIcon, RotateCw, ShieldCheck, Upload } from "lucide-react";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { BackHeader } from "@/components/back-header";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { classifyProductImage, scanProductExpiry } from "@/lib/api";
import { ui } from "@/lib/tokens";
import { cn } from "@/lib/utils";

const issues = ["Expired Product", "Damaged Product"];
const processingText = ["Scanning product label", "Checking image clarity", "Estimating refund confidence"];

function ReturnStep({ current }: { current: number }) {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4].map((step) => (
        <span key={step} className={cn("h-1.5 flex-1 rounded-pill", step <= current ? "bg-primary" : "bg-border")} />
      ))}
    </div>
  );
}

export default function ReturnFlowPage() {
  const [step, setStep] = useState(1);
  const [issue, setIssue] = useState(issues[0]);
  const [processingIndex, setProcessingIndex] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState("");
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step !== 3) return;
    const timer = window.setInterval(() => setProcessingIndex((value) => (value + 1) % processingText.length), 800);
    return () => window.clearInterval(timer);
  }, [step]);

  const goNext = () => setStep((value) => Math.min(4, value + 1));

  const selectFile = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null;
    setFile(selectedFile);
    setError("");
  };

  const analyzeImage = async () => {
    if (!file) {
      setError("Please upload a product image first.");
      return;
    }

    setError("");
    setStep(3);

    try {
      const response = issue === "Expired Product"
        ? await scanProductExpiry(file)
        : await classifyProductImage(file);
      setResult(response);
      setStep(4);
    } catch {
      setError("The return check could not be completed.");
      setStep(2);
    }
  };

  return (
    <PageShell className="space-y-5">
      <BackHeader title="Return Help" href="/ai" />
      <ReturnStep current={step} />
      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.section key="issue" className={cn(ui.card, "space-y-4 p-4")} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <h2 className={ui.sectionTitle}>What went wrong?</h2>
            <div className="grid grid-cols-2 gap-2">
              {issues.map((item) => (
                <button key={item} onClick={() => setIssue(item)} className={cn("rounded-pill border px-3 py-3 text-sm font-extrabold", issue === item ? "border-primary bg-primary text-surface" : "border-border bg-surface text-ink")}>{item}</button>
              ))}
            </div>
            <Button onClick={goNext} className="w-full">Next</Button>
          </motion.section>
        ) : null}
        {step === 2 ? (
          <motion.section key="upload" className="space-y-4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <div className="grid place-items-center rounded-lg border-2 border-dashed border-border bg-surface p-8 text-center">
              <Upload className="h-10 w-10 text-primary" />
              <p className="mt-3 text-base font-extrabold">Add product proof</p>
              <p className="mt-1 text-sm font-semibold text-muted">{file ? file.name : "Upload a product image"}</p>
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={selectFile} className="hidden" />
              <input ref={galleryInputRef} type="file" accept="image/*" onChange={selectFile} className="hidden" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button type="button" variant="ghost" onClick={() => cameraInputRef.current?.click()}><Camera className="h-4 w-4" />Camera</Button>
              <Button type="button" variant="ghost" onClick={() => galleryInputRef.current?.click()}><ImageIcon className="h-4 w-4" />Gallery</Button>
            </div>
            <textarea className={cn(ui.input, "min-h-28 w-full p-4 font-semibold")} placeholder="Add more details" />
            {error ? <p className="text-sm font-bold text-coral">{error}</p> : null}
            <Button onClick={analyzeImage} className="w-full">Analyze</Button>
          </motion.section>
        ) : null}
        {step === 3 ? (
          <motion.section key="processing" className={cn(ui.card, "grid place-items-center gap-5 p-8 text-center")} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="grid h-24 w-24 place-items-center rounded-pill border-4 border-primary-light border-t-primary">
              <RotateCw className="h-8 w-8 text-primary" />
            </motion.div>
            <p className="text-base font-extrabold">{processingText[processingIndex]}</p>
          </motion.section>
        ) : null}
        {step === 4 ? (
          <motion.section key="result" className={cn(ui.card, "space-y-4 p-5")} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <span className="inline-flex items-center gap-2 rounded-pill bg-primary-light px-3 py-1 text-sm font-extrabold text-primary"><ShieldCheck className="h-4 w-4" />Return Check Complete</span>
            <h2 className={ui.title}>{result?.confidence ? `Confidence ${Math.round(result.confidence * 100)}%` : result?.result ?? result?.label ?? "Result ready"}</h2>
            <p className="text-sm font-semibold leading-6 text-muted">{result?.message ?? result?.result ?? `The product image was checked for ${issue.toLowerCase()}.`}</p>
            <Button className="w-full"><CheckCircle2 className="h-4 w-4" />Raise Refund</Button>
          </motion.section>
        ) : null}
      </AnimatePresence>
    </PageShell>
  );
}
