import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  name: string;
  email: string;
  temporaryPassword?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, temporaryPassword }: WelcomeEmailRequest = await req.json();

    const emailContent = temporaryPassword 
      ? `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Bem-vindo(a) ao Sistema Blessy!</h1>
          <p>Olá ${name},</p>
          <p>Uma conta foi criada para você no sistema Blessy. Aqui estão suas credenciais de acesso:</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Senha temporária:</strong> ${temporaryPassword}</p>
          </div>
          
          <p><strong>Importante:</strong> Por questões de segurança, você será obrigado(a) a alterar sua senha no primeiro login.</p>
          
          <p>Para acessar o sistema, clique no link abaixo:</p>
          <a href="${Deno.env.get("SITE_URL") || "https://your-app.lovable.app"}/login" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Acessar Sistema
          </a>
          
          <p>Se você tiver alguma dúvida, entre em contato com o administrador do sistema.</p>
          
          <p>Atenciosamente,<br>Equipe Blessy</p>
        </div>
      `
      : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Bem-vindo(a) ao Sistema Blessy!</h1>
          <p>Olá ${name},</p>
          <p>Sua conta foi criada com sucesso no sistema Blessy.</p>
          
          <p>Para acessar o sistema, clique no link abaixo:</p>
          <a href="${Deno.env.get("SITE_URL") || "https://your-app.lovable.app"}/login" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Acessar Sistema
          </a>
          
          <p>Se você tiver alguma dúvida, entre em contato com o administrador do sistema.</p>
          
          <p>Atenciosamente,<br>Equipe Blessy</p>
        </div>
      `;

    const emailResponse = await resend.emails.send({
      from: "Blessy <onboarding@resend.dev>", // Replace with your verified domain
      to: [email],
      subject: "Bem-vindo(a) ao Sistema Blessy!",
      html: emailContent,
    });

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);