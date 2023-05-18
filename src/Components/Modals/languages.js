const languages = {
  es: {
    step0: "Actualmente haz completado el paso 0 de 2",
    step1: "Actualmente haz completado el paso 1 de 2",
    complete: "Actualmente tienes una línea de prueba",
    warning:
      "Te hemos asignado una línea de prueba, por lo que las acciones dentro de la plataforma son limitadas. Completa el recorrido para acceder a todas las funcionalidades",
    completeOnb: "Completar recorrido ahora",
    completeLater: "Completar recorrido en otro momento",
    select: "Seleccionar...",
    goToTestFeature: "¡Genial! Ir a probar funcionalidad →",
    treeStepToTestFeature:
      "👋  Para probar la nueva funcionalidad sigue los siguientes 3 pasos: ",
    feedbackModalTitle: "Compartir experiencia",
    feedbackModalInfo:
      "Tu feedback es muy importante para nosotros. Cuéntanos un poco más sobre tu experiencia utilizando la nueva funcionalidad de Bloque Objetivo 😃😐😡",
    writeHere: "Escribe aquí...",
    cancel: "Cancelar",
    sendResponse: "Enviar respuesta",
    selectLink: "Selecciona un link...",
    repeatedUrls: "Hay eventos con urls repetidas",
    selectOption: "Selecciona una opción...",
    linksNotFound:
      "⚠️  No se ha encontrado ningún link/enlace en este bloque, coloca un link dentro del mensaje para habilitar la función",
    whereSeeResults: "¿Dónde puedo ver los resultados del bloque objetivo?",
    detailResultModal:
      'En las métricas de la conversación donde hayas creado un bloque objetivo, encontrarás los resultados directamente en la tabla de "Pregunta por pregunta" como se muestra en la imagen',
    understood: "Entendido",
    goalAwareness: "Generar awareness",
    goalEncourageStore:
      "Incentivar compra de un producto/servicio (En tienda física)",
    goalEncourageECommerce:
      "Incentivar compra de un producto/servicio (e-commerce)",
    goalLeadsData: "Captar datos de mis leads",
    goalSubscriptionRenewal:
      "Incentivar la renovación de una suscripción/membresía",
    goalPromotions: "Compartir ofertas/promociones",
    goalEncourageEvent: "Incentivar participación en un reto o evento",
    goalReferralProgram: "Programa de referidos",
    goalEncourageReactivation:
      "Incentivar reactivación de un plan/servicio/membresía",
    goalMeasureSatisfaction: "Medir la satisfacción",
    goalNotifications: "Recordatorios/Notificaciones",
    goalEncourageBuyback: "Incentivar la recompra de un producto/servicio",
    goalNurtureLeads: "Nutrir a mis leads",
    goalImpulseFunnel: "Impulsar el avance de mis leads en el embudo",
    goalWebTraffic: "Enviar tráfico a mi sitio web",
    goalPatternSurvey: "Entender algún patrón de mis usuarios con una encuesta",
    goalOther: "Otro",
    selectGoalCampaign: "Selecciona la meta de tu campaña",
    defineGoals: "Agrega uno o varios objetivos*",
    selectGoalType: "Selecciona un objetivo",
    clicksNumber: "Clic en link",
    buttonClicksNumber: "Clic en botón con link",
    readersNumber: "Cantidad de usuarios que leyeron el mensaje",
    buttonLinkDisableTooltip1:
      "La opción para rastrear los clics en el links de HSM's solo se encuentra disponible en los nuevos HSM's que crees a partir de ahora.",
    buttonLinkDisableTooltip2:
      "Prueba creando uno nuevo desde plantillas de mensajes.",
    defineExpectationsTooltip:
      "Puedes activar esta opción para comparar tus expectativas de campaña vs la cantidad real de usuarios que hiceron clic en el enlace",
    defineExpectations: "Define expectativas de clics en el link",
    defineButtonExpectations: "Define expectativas de clics en botón con link",
    clicksPercentage: "% clics",
    addOtherGoal: "Agrega otro objetivo",
    deleteGoal: "Eliminar objetivo",
    creatGoalBlock: "Crear bloque objetivo",
    goalBlock: "Bloque objetivo",
    placeLink: "Coloca un link/enlace dentro del mensaje de un bloque básico.",
    clickOnStarIcon: "Haz clic sobre el ícono con forma de estrella.",
    selectAndStartToMeasure:
      "Selecciona la meta de tu campaña y ¡Comienza a medir!",
    doubleHSMD:
      "Envía un segundo HSM dentro del periodo de las 24 horas sin costo adicional a todos aquellos números contactados que no respondan al primer HSM enviado",
    selectDoubleHSMTemplate: "Selecciona una plantilla HSM",
    selectTemplate: "Selecciona una plantilla",
    createDoubleHSM: "Crear HSM x2",
    defineTimeInterval: "Define el intervalo de tiempo",
    secondHSMTimeMessage: "La segunda plantilla HSM se enviará después de:",
    minutes: "Minutos",
    hours: "Horas",
    invalidSecondHSMTime: "Define un tiempo dentro del periodo de las 24 horas",
    secondHSMTimingReminder: 
      "Recuerda que es importante definir un intervalo de tiempo que no sea tan corto entre el primer HSM y el segundo, de lo contrario tus contactos podrían tomarlo como spam."
  },
  en: {
    step0: "You have currently completed step 0 of 2",
    step1: "You have currently completed step 1 of 2",
    complete: "Currently you have a test line",
    warning:
      "We have assigned you a test line, so actions within the platform are limited. Complete the tour to access all functionalities",
    completeOnb: "Complete tour now",
    completeLater: "Complete tour at another time",
    select: "Select...",
    goToTestFeature: "Great! Go to test functionality →",
    treeStepToTestFeature:
      "👋 To test the new functionality follow the next 3 steps: ",
    feedbackModalTitle: "Share experience",
    feedbackModalInfo:
      "Your feedback is very important to us. Tell us a bit more about your experience using the new Target Block functionality 😃😐😡",
    writeHere: "Write here...",
    cancel: "Cancel",
    sendResponse: "Send response",
    selectLink: "Select a link...",
    repeatedUrls: "There are events with repeated urls",
    selectOption: "Select an option...",
    linksNotFound:
      "⚠️  No link found in this block, place a link inside the message to enable the function.",
    whereSeeResults: "Where can I see the results of the target block?",
    detailResultModal:
      'In the conversation metrics where you have created a target block, you will find the results directly in the "Question by question" table as shown in the picture below',
    understood: "Understood",
    goalAwareness: "Generate awareness",
    goalEncourageStore:
      "Incentivize the purchase of a product/service (In a physical store)",
    goalEncourageECommerce:
      "Incentivize the purchase of a product/service (e-commerce)",
    goalLeadsData: "Fetch data from my leads",
    goalSubscriptionRenewal:
      "Incentivize the renewal of a subscription/membership",
    goalPromotions: "Share deals/promotions",
    goalEncourageEvent: "Incentivize participation in a challenge or event",
    goalReferralProgram: "Referral Program",
    goalEncourageReactivation:
      "Incentivize reactivation of a plan/service/membership",
    goalMeasureSatisfaction: "Measure satisfaction",
    goalNotifications: "Reminders/Notifications",
    goalEncourageBuyback: "Incentivize the repurchase of a product/service",
    goalNurtureLeads: "Nurture my leads",
    goalImpulseFunnel: "Impulse my leads forward in the funnel",
    goalWebTraffic: "Send traffic to my website",
    goalPatternSurvey: "Understand some pattern of my users with a survey",
    goalOther: "Other",
    selectGoalCampaign: "Select your campaign goal",
    defineGoals: "Add one or more objectives*",
    selectGoalType: "Select a goal",
    clicksNumber: "Click on link",
    buttonClicksNumber: "Click on button with link",
    readersNumber: "Number of users who read the message",
    buttonLinkDisableTooltip1:
      "The option to track link clicks on HSM's is only available on new HSM's you create from now on.",
    buttonLinkDisableTooltip2: "Try creating a new one from message templates.",
    defineExpectationsTooltip:
      "You can activate this option to compare your campaign expectations vs the actual number of users who clicked on the link",
    defineExpectations: "Define clicks expectations on the link",
    defineButtonExpectations:
      "Define clicks expectations on a button with a link",
    clicksPercentage: "% clicks",
    addOtherGoal: "Add another goal",
    deleteGoal: "Delete goal",
    creatGoalBlock: "Create goal block",
    goalBlock: "Goal block",
    placeLink: "Places a link within the message of a basic block.",
    clickOnStarIcon: "Click on the star icon.",
    selectAndStartToMeasure: "Select your campaign goal and start measuring!",
    doubleHSMD:
      "Send a second HSM within a period of 24 hours without additional cost to all of your contacted numbers who did not respond to the first HSM message",
    selectDoubleHSMTemplate: "Select an HSM template",
    selectTemplate: "Select a template",
    createDoubleHSM: "Create HSM x2",
    defineTimeInterval: "Define the interval of time",
    secondHSMTimeMessage: "The second HSM message will send after:",
    minutes: "Minutes",
    hours: "Hours",
    invalidSecondHSMTime: "Choose a time within a period of 24 hours",
    secondHSMTimingReminder: 
      "Remember that it's important to choose a time interval that is not too short between the first and second HSM, since your contacts might think it's spam"
  },
  pr: {
    step0: "Você concluiu atualmente a etapa 0 de 2",
    step1: "Você concluiu atualmente a etapa 1 de 2",
    complete: "Atualmente você tem uma linha de teste",
    warning:
      "Nós lhe designamos uma linha de teste, portanto, as ações dentro da plataforma são limitadas. Complete o tour para ter acesso a todas as funcionalidades",
    completeOnb: "Tour completo agora",
    completeLater: "Completar o tour em outro momento",
    select: "Seleccionar...",
    goToTestFeature: "Ótimo! Ir para funcionalidade do teste →",
    treeStepToTestFeature:
      "👋 Para testar a nova funcionalidade, siga estes 3 passos: ",
    feedbackModalTitle: "Compartilhar experiência",
    feedbackModalInfo:
      "Sua opinião é muito importante para nós. Conte-nos um pouco mais sobre sua experiência usando a nova funcionalidade Target Block 😃😐😡",
    writeHere: "Escreva aqui...",
    cancel: "Cancelar",
    sendResponse: "Enviar resposta",
    selectLink: "Selecionar um link...",
    repeatedUrls: "Há eventos com urls repetidas",
    selectOption: "Selecione uma opção...",
    linksNotFound:
      "⚠️  Nenhum link foi encontrado neste bloco, coloque um link dentro da mensagem para habilitar o recurso",
    whereSeeResults: "Onde posso ver os resultados do bloco alvo?",
    detailResultModal:
      'Nas métricas de conversação em que você criou um bloco alvo, você encontrará os resultados diretamente na tabela "Pergunta por pergunta", como mostrado na figura abaixo',
    understood: "Entendido",
    goalAwareness: "Gerar conscientização",
    goalEncourageStore:
      "Incentivar a compra de um produto/serviço (Em uma loja física)",
    goalEncourageECommerce:
      "Incentivar a compra de um produto/serviço (e-commerce)",
    goalLeadsData: "Buscar dados dos meus leads",
    goalSubscriptionRenewal: "Incentivar a renovação de uma assinatura/adesão",
    goalPromotions: "Compartilhar ofertas/promoções",
    goalEncourageEvent: "Incentivar a participação em um desafio ou evento",
    goalReferralProgram: "Programa de Referência",
    goalEncourageReactivation:
      "Incentivar a reativação de um plano/serviço/assinatura",
    goalMeasureSatisfaction: "Medir a satisfação",
    goalNotifications: "Lembretes/Notificações",
    goalEncourageBuyback: "Incentivar a recompra de um produto/serviço",
    goalNurtureLeads: "Cultive meus leads",
    goalImpulseFunnel: "Impulse meus leads para frente no funil",
    goalWebTraffic: "Enviar tráfego para meu site",
    goalPatternSurvey:
      "Entender algum padrão dos meus usuários com uma pesquisa",
    goalOther: "Outro",
    selectGoalCampaign: "Selecione seu objetivo de campanha",
    defineGoals: "Adicione um ou mais objetivos*",
    selectGoalType: "Selecione um objetivo",
    clicksNumber: "Clique no link",
    buttonClicksNumber: "Clique no botão com link",
    readersNumber: "Número de usuários que leram a mensagem",
    buttonLinkDisableTooltip1:
      "A opção de rastrear cliques em links em HSMs só está disponível em novos HSMs que você criar a partir de agora.",
    buttonLinkDisableTooltip2:
      "Tente criar um novo a partir de modelos de mensagem.",
    defineExpectationsTooltip:
      "Você pode ativar esta opção para comparar suas expectativas de campanha com o número real de usuários que clicaram no link",
    defineExpectations: "Defina as expectativas de cliques no link",
    defineButtonExpectations:
      "Definir expectativas de cliques em um botão com um link",
    clicksPercentage: "% cliques",
    addOtherGoal: "Adicionar outra meta",
    deleteGoal: "Remove objetivo",
    creatGoalBlock: "Criar bloco objetivo",
    goalBlock: "Bloco objetivo",
    placeLink: "Coloca um link dentro da mensagem de um bloco básico.",
    clickOnStarIcon: "Clique no ícone da estrela.",
    selectAndStartToMeasure: "Selecione sua meta de campanha e comece a medir!",
  },
};

export default languages;
